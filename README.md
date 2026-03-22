# SIM Gamba — Systeme d'Information Municipal

## Stack
- Next.js 14 App Router
- Supabase (Auth + PostgreSQL + RLS)
- Tailwind CSS
- TypeScript

## Structure
```
src/
  app/
    login/              Page de connexion
    mot-de-passe-oublie/
    dashboard/
      civil/            Etat civil
      habitants/        Registre habitants
      taxes/            Taxes et recettes
      courriers/        Courriers
      devlocal/         Developpement local
      personnel/        Personnel
      foncier/          Foncier
      marches/          Marches publics
      audit/            Journal d'audit
  components/
    layout/             Sidebar, Topbar
    ui/                 Badge, Button, Modal, Table, StatCard, ProgressBar, PageHeader
  lib/
    supabase/           client.ts, server.ts, admin.ts
    utils/              index.ts (helpers), audit.ts
    hooks/              useProfile.ts
  types/                index.ts (tous les types TS)
  middleware.ts         Protection des routes
supabase/
  schema.sql            Schema SQL complet avec RLS
```

## Installation

```bash
npm install
cp .env.local.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

## Base de donnees Supabase

1. Creer un projet sur https://supabase.com
2. Aller dans SQL Editor
3. Executer le contenu de `supabase/schema.sql` en entier
4. Verifier que les tables sont creees dans l'onglet Table Editor

## Creer le premier compte super admin

Dans le dashboard Supabase > Authentication > Users > Invite user:
- Email: votre@email.com
- Apres creation, mettre a jour le profil via SQL Editor:

```sql
UPDATE profiles SET role = 'super_admin', actif = true WHERE email = 'votre@email.com';
```

## Creer une mairie cliente

```sql
INSERT INTO mairies (nom, province, pays, statut)
VALUES ('Mairie de Gamba', 'Ogooue-Maritime', 'Gabon', 'active');
```

## Creer les comptes agents

Depuis Supabase Auth ou via l'interface admin (a venir):

```sql
-- Apres avoir invite l'utilisateur via Supabase Auth
UPDATE profiles
SET role = 'admin', mairie_id = '<uuid_mairie>', actif = true, nom = 'Ibinga', prenom = 'Robert', poste = 'Maire'
WHERE email = 'maire@mairie-gamba.ga';
```

## Deploiement Vercel

```bash
npm run build
# Deployer sur Vercel, ajouter les variables d'environnement
```

## Roles
- super_admin : acces total, gestion de toutes les mairies
- admin       : maire, acces total a sa mairie
- senior      : lecture/ecriture sur son service
- saisie      : saisie uniquement, pas de modification ni suppression

## Securite
- RLS active sur toutes les tables
- Session expiree apres 8h (a configurer dans Supabase Auth settings)
- Blocage apres 5 tentatives (gere cote client + a configurer dans Supabase)
- Soft delete sur tous les enregistrements (deleted_at)
- Journal d'audit complet
