-- ============================================================
-- SIM Gamba -- Schema Supabase complet
-- Systeme d'Information Municipal
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type role_utilisateur as enum ('super_admin', 'admin', 'senior', 'saisie');
create type statut_mairie as enum ('active', 'suspendue', 'expiree');
create type type_acte as enum ('naissance', 'mariage', 'deces');
create type type_courrier as enum ('entrant', 'sortant');
create type statut_courrier as enum ('en_attente', 'en_cours', 'traite', 'archive');
create type statut_projet as enum ('demarrage', 'en_cours', 'termine', 'suspendu');
create type type_contrat as enum ('CDI', 'CDD', 'stage', 'vacation');
create type statut_agent as enum ('actif', 'conge', 'suspendu', 'quitte');
create type statut_parcelle as enum ('titree', 'en_cours', 'litige', 'libre');
create type type_marche as enum ('appel_offres', 'gre_a_gre', 'direct');
create type statut_marche as enum ('preparation', 'ouvert', 'attribue', 'en_cours', 'termine', 'annule');
create type type_taxe as enum ('patente', 'fonciere', 'occupation', 'autre');
create type statut_paiement as enum ('paye', 'en_attente', 'en_retard', 'exonere');

-- ============================================================
-- TABLE MAIRIES (clients)
-- ============================================================

create table mairies (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  nom             text not null,
  province        text not null,
  pays            text not null default 'Gabon',
  email_contact   text,
  telephone       text,
  adresse         text,
  statut          statut_mairie not null default 'active',
  licence_debut   date not null default current_date,
  licence_fin     date,
  notes_admin     text
);

-- ============================================================
-- TABLE PROFILES (extension auth.users)
-- ============================================================

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid references auth.users(id),
  mairie_id       uuid references mairies(id),

  nom             text not null,
  prenom          text not null,
  email           text not null,
  poste           text,
  service         text,
  role            role_utilisateur not null default 'saisie',
  actif           boolean not null default true,
  derniere_connexion timestamptz,
  tentatives_echec int not null default 0,
  bloque_jusqu_a  timestamptz
);

-- ============================================================
-- TABLE ACTES CIVILS
-- ============================================================

create table actes_civils (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  numero_acte     text not null,
  type_acte       type_acte not null,
  date_evenement  date not null,
  page_registre   text not null,
  annee_registre  int not null,

  -- Personne concernee
  nom_principal   text not null,
  prenom_principal text,
  date_naissance  date,
  lieu_naissance  text,
  nationalite     text default 'Gabonaise',
  nom_pere        text,
  nom_mere        text,

  -- Pour mariage
  nom_conjoint    text,
  prenom_conjoint text,

  -- Meta
  declarant       text,
  temoin1         text,
  temoin2         text,
  observations    text,
  recepisse_imprime boolean not null default false,
  recepisse_date  timestamptz
);

-- ============================================================
-- TABLE HABITANTS
-- ============================================================

create table habitants (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  nom             text not null,
  prenom          text not null,
  date_naissance  date,
  lieu_naissance  text,
  nationalite     text default 'Gabonaise',
  sexe            text check (sexe in ('M', 'F')),
  situation_familiale text check (situation_familiale in ('celibataire', 'marie', 'divorce', 'veuf')),
  profession      text,
  numero_cni      text,
  numero_passeport text,

  -- Adresse
  quartier        text,
  rue             text,
  telephone       text,
  email           text,

  -- Liens
  acte_naissance_id uuid references actes_civils(id),
  observations    text
);

-- ============================================================
-- TABLE CONTRIBUABLES
-- ============================================================

create table contribuables (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  nom             text not null,
  type_contribuable text check (type_contribuable in ('particulier', 'entreprise')) default 'particulier',
  numero_contribuable text,
  adresse         text,
  telephone       text,
  email           text,
  habitant_id     uuid references habitants(id)
);

-- ============================================================
-- TABLE PAIEMENTS TAXES
-- ============================================================

create table paiements_taxes (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  contribuable_id uuid not null references contribuables(id),
  type_taxe       type_taxe not null,
  annee_exercice  int not null,
  montant_du      numeric(12,2) not null,
  montant_paye    numeric(12,2),
  date_paiement   date,
  mode_paiement   text,
  reference_recu  text unique,
  statut          statut_paiement not null default 'en_attente',
  date_echeance   date,
  penalite        numeric(12,2) default 0,
  observations    text,
  recu_imprime    boolean not null default false
);

-- ============================================================
-- TABLE COURRIERS
-- ============================================================

create table courriers (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  numero_reference text not null,
  type_courrier   type_courrier not null,
  date_reception  date,
  date_envoi      date,
  objet           text not null,
  expediteur      text,
  destinataire    text,
  service_concerne text,
  statut          statut_courrier not null default 'en_attente',
  priorite        text check (priorite in ('normale', 'urgente', 'confidentielle')) default 'normale',
  traite_par      uuid references auth.users(id),
  date_traitement date,
  reponse_requise boolean default false,
  date_limite_reponse date,
  observations    text,
  fichier_url     text
);

-- ============================================================
-- TABLE ENTREPRENEURS
-- ============================================================

create table entrepreneurs (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  nom             text not null,
  prenom          text,
  raison_sociale  text,
  secteur         text not null,
  numero_rccm     text,
  adresse         text,
  telephone       text,
  email           text,
  habitant_id     uuid references habitants(id),
  observations    text
);

-- ============================================================
-- TABLE PROJETS
-- ============================================================

create table projets (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  entrepreneur_id uuid not null references entrepreneurs(id),
  intitule        text not null,
  description     text,
  secteur         text,
  date_debut      date not null,
  date_fin_prevue date,
  date_fin_reelle date,
  avancement      int not null default 0 check (avancement >= 0 and avancement <= 100),
  statut          statut_projet not null default 'demarrage',
  montant_estime  numeric(14,2),
  observations    text
);

-- ============================================================
-- TABLE AGENTS (personnel municipal)
-- ============================================================

create table agents (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  nom             text not null,
  prenom          text not null,
  date_naissance  date,
  numero_matricule text,
  poste           text not null,
  service         text not null,
  type_contrat    type_contrat not null default 'CDD',
  date_embauche   date not null,
  date_fin_contrat date,
  salaire_base    numeric(12,2),
  telephone       text,
  email           text,
  adresse         text,
  statut          statut_agent not null default 'actif',
  profile_id      uuid references profiles(id),
  observations    text
);

-- ============================================================
-- TABLE CONGES
-- ============================================================

create table conges (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  agent_id        uuid not null references agents(id),
  type_conge      text not null,
  date_debut      date not null,
  date_fin        date not null,
  nombre_jours    int,
  statut          text check (statut in ('demande', 'approuve', 'refuse', 'annule')) default 'demande',
  approuve_par    uuid references auth.users(id),
  motif           text,
  observations    text
);

-- ============================================================
-- TABLE PARCELLES
-- ============================================================

create table parcelles (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  numero_parcelle text not null,
  quartier        text,
  superficie_m2   numeric(10,2),
  proprietaire    text,
  habitant_id     uuid references habitants(id),
  numero_titre    text,
  date_titre      date,
  statut          statut_parcelle not null default 'en_cours',
  description_litige text,
  valeur_estimee  numeric(14,2),
  usage           text,
  coordonnees_gps text,
  observations    text
);

-- ============================================================
-- TABLE MARCHES PUBLICS
-- ============================================================

create table marches (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_by      uuid not null references auth.users(id),
  mairie_id       uuid not null references mairies(id),

  numero_marche   text not null,
  objet           text not null,
  type_marche     type_marche not null default 'appel_offres',
  prestataire     text,
  montant_fcfa    numeric(16,2),
  date_attribution date,
  date_debut      date,
  date_fin_prevue date,
  date_fin_reelle date,
  avancement      int not null default 0 check (avancement >= 0 and avancement <= 100),
  statut          statut_marche not null default 'preparation',
  caution         numeric(14,2),
  retenue_garantie numeric(14,2),
  penalites       numeric(14,2) default 0,
  service_concerne text,
  observations    text
);

-- ============================================================
-- TABLE AUDIT LOG
-- ============================================================

create table audit_log (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  mairie_id       uuid references mairies(id),

  utilisateur_id  uuid not null references auth.users(id),
  utilisateur_nom text not null,
  action          text not null,
  table_cible     text not null,
  enregistrement_id uuid,
  valeur_avant    jsonb,
  valeur_apres    jsonb,
  ip_address      text,
  user_agent      text
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_profiles_mairie on profiles(mairie_id);
create index idx_profiles_role on profiles(role);
create index idx_actes_mairie on actes_civils(mairie_id);
create index idx_actes_type on actes_civils(type_acte);
create index idx_actes_nom on actes_civils(nom_principal);
create index idx_habitants_mairie on habitants(mairie_id);
create index idx_habitants_quartier on habitants(quartier);
create index idx_habitants_nom on habitants(nom, prenom);
create index idx_paiements_mairie on paiements_taxes(mairie_id);
create index idx_paiements_statut on paiements_taxes(statut);
create index idx_courriers_mairie on courriers(mairie_id);
create index idx_courriers_statut on courriers(statut);
create index idx_entrepreneurs_mairie on entrepreneurs(mairie_id);
create index idx_projets_mairie on projets(mairie_id);
create index idx_projets_statut on projets(statut);
create index idx_agents_mairie on agents(mairie_id);
create index idx_parcelles_mairie on parcelles(mairie_id);
create index idx_marches_mairie on marches(mairie_id);
create index idx_audit_mairie on audit_log(mairie_id);
create index idx_audit_user on audit_log(utilisateur_id);
create index idx_audit_created on audit_log(created_at desc);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_mairies_updated before update on mairies
  for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_actes_updated before update on actes_civils
  for each row execute function set_updated_at();
create trigger trg_habitants_updated before update on habitants
  for each row execute function set_updated_at();
create trigger trg_contribuables_updated before update on contribuables
  for each row execute function set_updated_at();
create trigger trg_paiements_updated before update on paiements_taxes
  for each row execute function set_updated_at();
create trigger trg_courriers_updated before update on courriers
  for each row execute function set_updated_at();
create trigger trg_entrepreneurs_updated before update on entrepreneurs
  for each row execute function set_updated_at();
create trigger trg_projets_updated before update on projets
  for each row execute function set_updated_at();
create trigger trg_agents_updated before update on agents
  for each row execute function set_updated_at();
create trigger trg_conges_updated before update on conges
  for each row execute function set_updated_at();
create trigger trg_parcelles_updated before update on parcelles
  for each row execute function set_updated_at();
create trigger trg_marches_updated before update on marches
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: creation automatique du profil apres inscription
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, nom, prenom, role, mairie_id, created_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', 'Inconnu'),
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    coalesce(new.raw_user_meta_data->>'role', 'saisie')::role_utilisateur,
    (new.raw_user_meta_data->>'mairie_id')::uuid,
    (new.raw_user_meta_data->>'created_by')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: mise a jour derniere connexion
-- ============================================================

create or replace function handle_user_login()
returns trigger language plpgsql security definer as $$
begin
  update profiles
  set derniere_connexion = now(), tentatives_echec = 0
  where id = new.id;
  return new;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table mairies enable row level security;
alter table profiles enable row level security;
alter table actes_civils enable row level security;
alter table habitants enable row level security;
alter table contribuables enable row level security;
alter table paiements_taxes enable row level security;
alter table courriers enable row level security;
alter table entrepreneurs enable row level security;
alter table projets enable row level security;
alter table agents enable row level security;
alter table conges enable row level security;
alter table parcelles enable row level security;
alter table marches enable row level security;
alter table audit_log enable row level security;

-- Helper: recuperer le role de l'utilisateur courant
create or replace function get_my_role()
returns role_utilisateur language sql security definer stable as $$
  select role from profiles where id = auth.uid() and deleted_at is null;
$$;

-- Helper: recuperer la mairie_id de l'utilisateur courant
create or replace function get_my_mairie()
returns uuid language sql security definer stable as $$
  select mairie_id from profiles where id = auth.uid() and deleted_at is null;
$$;

-- Helper: est super_admin
create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'super_admin'
    and deleted_at is null
  );
$$;

-- ---- MAIRIES ----
create policy "super_admin_all_mairies" on mairies
  for all using (is_super_admin());

create policy "admin_read_own_mairie" on mairies
  for select using (id = get_my_mairie());

-- ---- PROFILES ----
create policy "super_admin_all_profiles" on profiles
  for all using (is_super_admin());

create policy "admin_manage_profiles" on profiles
  for all using (
    mairie_id = get_my_mairie()
    and get_my_role() = 'admin'
  );

create policy "user_read_own_profile" on profiles
  for select using (id = auth.uid());

create policy "user_update_own_profile" on profiles
  for update using (id = auth.uid());

-- ---- POLICY GENERIQUE PAR MAIRIE (toutes les tables metier) ----
-- Lecture: tous les agents actifs de la mairie
-- Ecriture: senior et admin
-- Suppression (soft delete): admin uniquement

-- ACTES CIVILS
create policy "read_actes" on actes_civils
  for select using (mairie_id = get_my_mairie() and deleted_at is null);

create policy "insert_actes" on actes_civils
  for insert with check (
    mairie_id = get_my_mairie()
    and get_my_role() in ('admin', 'senior', 'saisie')
  );

create policy "update_actes" on actes_civils
  for update using (
    mairie_id = get_my_mairie()
    and get_my_role() in ('admin', 'senior')
    and deleted_at is null
  );

create policy "delete_actes" on actes_civils
  for update using (
    mairie_id = get_my_mairie()
    and get_my_role() = 'admin'
  );

-- HABITANTS
create policy "read_habitants" on habitants
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_habitants" on habitants
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_habitants" on habitants
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- CONTRIBUABLES
create policy "read_contribuables" on contribuables
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_contribuables" on contribuables
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_contribuables" on contribuables
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- PAIEMENTS TAXES
create policy "read_paiements" on paiements_taxes
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_paiements" on paiements_taxes
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_paiements" on paiements_taxes
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- COURRIERS
create policy "read_courriers" on courriers
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_courriers" on courriers
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_courriers" on courriers
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- ENTREPRENEURS
create policy "read_entrepreneurs" on entrepreneurs
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_entrepreneurs" on entrepreneurs
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_entrepreneurs" on entrepreneurs
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- PROJETS
create policy "read_projets" on projets
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_projets" on projets
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_projets" on projets
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- AGENTS
create policy "read_agents" on agents
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_agents" on agents
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior'));
create policy "update_agents" on agents
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- CONGES
create policy "read_conges" on conges
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_conges" on conges
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_conges" on conges
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- PARCELLES
create policy "read_parcelles" on parcelles
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_parcelles" on parcelles
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior','saisie'));
create policy "update_parcelles" on parcelles
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- MARCHES
create policy "read_marches" on marches
  for select using (mairie_id = get_my_mairie() and deleted_at is null);
create policy "insert_marches" on marches
  for insert with check (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior'));
create policy "update_marches" on marches
  for update using (mairie_id = get_my_mairie() and get_my_role() in ('admin','senior') and deleted_at is null);

-- AUDIT LOG
create policy "read_audit_admin" on audit_log
  for select using (
    mairie_id = get_my_mairie()
    and get_my_role() in ('admin', 'super_admin')
  );
create policy "insert_audit" on audit_log
  for insert with check (true);
