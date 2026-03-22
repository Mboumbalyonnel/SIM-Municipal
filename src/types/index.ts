// ============================================================
// Types principaux du SIM Municipal
// ============================================================

export type RoleUtilisateur = 'super_admin' | 'admin' | 'senior' | 'saisie'
export type StatutMairie = 'active' | 'suspendue' | 'expiree'
export type TypeActe = 'naissance' | 'mariage' | 'deces'
export type TypeCourrier = 'entrant' | 'sortant'
export type StatutCourrier = 'en_attente' | 'en_cours' | 'traite' | 'archive'
export type StatutProjet = 'demarrage' | 'en_cours' | 'termine' | 'suspendu'
export type TypeContrat = 'CDI' | 'CDD' | 'stage' | 'vacation'
export type StatutAgent = 'actif' | 'conge' | 'suspendu' | 'quitte'
export type StatutParcelle = 'titree' | 'en_cours' | 'litige' | 'libre'
export type TypeMarche = 'appel_offres' | 'gre_a_gre' | 'direct'
export type StatutMarche = 'preparation' | 'ouvert' | 'attribue' | 'en_cours' | 'termine' | 'annule'
export type TypeTaxe = 'patente' | 'fonciere' | 'occupation' | 'autre'
export type StatutPaiement = 'paye' | 'en_attente' | 'en_retard' | 'exonere'

export interface Mairie {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  nom: string
  province: string
  pays: string
  email_contact: string | null
  telephone: string | null
  adresse: string | null
  statut: StatutMairie
  licence_debut: string
  licence_fin: string | null
  notes_admin: string | null
}

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
  mairie_id: string | null
  nom: string
  prenom: string
  email: string
  poste: string | null
  service: string | null
  role: RoleUtilisateur
  actif: boolean
  derniere_connexion: string | null
  tentatives_echec: number
  bloque_jusqu_a: string | null
  modules_autorises: string[] | null
  avatar_url: string | null
  mairie?: Mairie
}

export interface ActeCivil {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  numero_acte: string
  type_acte: TypeActe
  date_evenement: string
  page_registre: string
  annee_registre: number
  nom_principal: string
  prenom_principal: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  nationalite: string | null
  nom_pere: string | null
  nom_mere: string | null
  nom_conjoint: string | null
  prenom_conjoint: string | null
  declarant: string | null
  temoin1: string | null
  temoin2: string | null
  observations: string | null
  recepisse_imprime: boolean
  recepisse_date: string | null
}

export interface Habitant {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  nom: string
  prenom: string
  date_naissance: string | null
  lieu_naissance: string | null
  nationalite: string | null
  sexe: 'M' | 'F' | null
  situation_familiale: 'celibataire' | 'marie' | 'divorce' | 'veuf' | null
  profession: string | null
  numero_cni: string | null
  numero_passeport: string | null
  quartier: string | null
  rue: string | null
  telephone: string | null
  email: string | null
  acte_naissance_id: string | null
  observations: string | null
}

export interface Contribuable {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  nom: string
  type_contribuable: 'particulier' | 'entreprise'
  numero_contribuable: string | null
  adresse: string | null
  telephone: string | null
  email: string | null
  habitant_id: string | null
}

export interface PaiementTaxe {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  contribuable_id: string
  type_taxe: TypeTaxe
  annee_exercice: number
  montant_du: number
  montant_paye: number | null
  date_paiement: string | null
  mode_paiement: string | null
  reference_recu: string | null
  statut: StatutPaiement
  date_echeance: string | null
  penalite: number
  observations: string | null
  recu_imprime: boolean
  contribuable?: Contribuable
}

export interface Courrier {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  numero_reference: string
  type_courrier: TypeCourrier
  date_reception: string | null
  date_envoi: string | null
  objet: string
  expediteur: string | null
  destinataire: string | null
  service_concerne: string | null
  statut: StatutCourrier
  priorite: 'normale' | 'urgente' | 'confidentielle'
  traite_par: string | null
  date_traitement: string | null
  reponse_requise: boolean
  date_limite_reponse: string | null
  observations: string | null
  fichier_url: string | null
}

export interface Entrepreneur {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  nom: string
  prenom: string | null
  raison_sociale: string | null
  secteur: string
  numero_rccm: string | null
  adresse: string | null
  telephone: string | null
  email: string | null
  habitant_id: string | null
  observations: string | null
}

export interface Projet {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  entrepreneur_id: string
  intitule: string
  description: string | null
  secteur: string | null
  date_debut: string
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  avancement: number
  statut: StatutProjet
  montant_estime: number | null
  observations: string | null
  entrepreneur?: Entrepreneur
}

export interface Agent {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  nom: string
  prenom: string
  date_naissance: string | null
  numero_matricule: string | null
  poste: string
  service: string
  type_contrat: TypeContrat
  date_embauche: string
  date_fin_contrat: string | null
  salaire_base: number | null
  telephone: string | null
  email: string | null
  adresse: string | null
  statut: StatutAgent
  profile_id: string | null
  observations: string | null
}

export interface Conge {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  agent_id: string
  type_conge: string
  date_debut: string
  date_fin: string
  nombre_jours: number | null
  statut: 'demande' | 'approuve' | 'refuse' | 'annule'
  approuve_par: string | null
  motif: string | null
  observations: string | null
  agent?: Agent
}

export interface Parcelle {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  numero_parcelle: string
  quartier: string | null
  superficie_m2: number | null
  proprietaire: string | null
  habitant_id: string | null
  numero_titre: string | null
  date_titre: string | null
  statut: StatutParcelle
  description_litige: string | null
  valeur_estimee: number | null
  usage: string | null
  coordonnees_gps: string | null
  observations: string | null
}

export interface Marche {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  mairie_id: string
  numero_marche: string
  objet: string
  type_marche: TypeMarche
  prestataire: string | null
  montant_fcfa: number | null
  date_attribution: string | null
  date_debut: string | null
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  avancement: number
  statut: StatutMarche
  caution: number | null
  retenue_garantie: number | null
  penalites: number
  service_concerne: string | null
  observations: string | null
}

export interface AuditLog {
  id: string
  created_at: string
  mairie_id: string | null
  utilisateur_id: string
  utilisateur_nom: string
  action: string
  table_cible: string
  enregistrement_id: string | null
  valeur_avant: Record<string, unknown> | null
  valeur_apres: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
}

// ---- Helpers UI ----

export interface StatCard {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'danger' | 'warning'
}

export interface NavItem {
  label: string
  href: string
  icon: string
}