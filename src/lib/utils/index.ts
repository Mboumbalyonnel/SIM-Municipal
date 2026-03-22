import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: fr })
  } catch {
    return '-'
  }
}

export function formatMontant(montant: number | null | undefined): string {
  if (montant == null) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + ' FCFA'
}

export function formatDateLong(date: string | null): string {
  return formatDate(date, 'd MMMM yyyy')
}

export function initiales(nom: string, prenom?: string | null): string {
  const n = nom.charAt(0).toUpperCase()
  const p = prenom ? prenom.charAt(0).toUpperCase() : ''
  return n + p
}

export function nomComplet(nom: string, prenom?: string | null): string {
  if (!prenom) return nom
  return `${prenom} ${nom}`
}

export function generateReference(prefix: string): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${rand}`
}

export const LABELS_TYPE_ACTE: Record<string, string> = {
  naissance: 'Naissance',
  mariage:   'Mariage',
  deces:     'Deces',
}

export const LABELS_STATUT_PROJET: Record<string, string> = {
  demarrage: 'Demarrage',
  en_cours:  'En cours',
  termine:   'Termine',
  suspendu:  'Suspendu',
}

export const LABELS_STATUT_PAIEMENT: Record<string, string> = {
  paye:       'Paye',
  en_attente: 'En attente',
  en_retard:  'En retard',
  exonere:    'Exonere',
}

export const LABELS_STATUT_COURRIER: Record<string, string> = {
  en_attente: 'En attente',
  en_cours:   'En cours',
  traite:     'Traite',
  archive:    'Archive',
}

export const LABELS_STATUT_AGENT: Record<string, string> = {
  actif:    'Actif',
  conge:    'En conge',
  suspendu: 'Suspendu',
  quitte:   'Quitte',
}

export const LABELS_STATUT_PARCELLE: Record<string, string> = {
  titree:   'Titree',
  en_cours: 'En cours',
  litige:   'Litige',
  libre:    'Libre',
}

export const LABELS_STATUT_MARCHE: Record<string, string> = {
  preparation: 'Preparation',
  ouvert:      'Ouvert',
  attribue:    'Attribue',
  en_cours:    'En cours',
  termine:     'Termine',
  annule:      'Annule',
}

export const LABELS_TYPE_TAXE: Record<string, string> = {
  patente:    'Patente',
  fonciere:   'Fonciere',
  occupation: 'Occupation',
  autre:      'Autre',
}

export const LABELS_ROLE: Record<string, string> = {
  super_admin: 'Super administrateur',
  admin:       'Administrateur',
  senior:      'Agent senior',
  saisie:      'Agent de saisie',
}

export const SECTEURS = [
  'BTP', 'Commerce', 'Agriculture', 'Peche', 'Artisanat',
  'Transport', 'Services', 'Industrie', 'Tourisme', 'Autre',
]

export const SERVICES_MAIRIE = [
  'Direction generale',
  'Etat civil',
  'Taxes et recettes',
  'Urbanisme et foncier',
  'Developpement local',
  'Administration generale',
  'Comptabilite',
  'Ressources humaines',
]

export const MODULES_KEYS = [
  'civil', 'habitants', 'taxes', 'courriers',
  'devlocal', 'personnel', 'foncier', 'marches',
] as const

export type ModuleKey = typeof MODULES_KEYS[number]

export function hasModuleAccess(
  role: string,
  modulesAutorises: string[] | null,
  moduleKey: string
): boolean {
  if (role === 'admin' || role === 'super_admin') return true
  if (!modulesAutorises || modulesAutorises.length === 0) return false
  return modulesAutorises.includes(moduleKey)
}