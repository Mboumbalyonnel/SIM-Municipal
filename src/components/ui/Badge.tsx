import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'info'

const VARIANTS: Record<BadgeVariant, React.CSSProperties> = {
  green: { background: '#D8F3DC', color: '#1B4332' },
  amber: { background: '#FFF3CD', color: '#7D4E00' },
  red:   { background: '#FDECEA', color: '#9B2226' },
  blue:  { background: '#E8F0F9', color: '#1B3A5C' },
  gray:  { background: '#F1F0EB', color: '#6B6960' },
  info:  { background: '#E8F0F9', color: '#1B3A5C' },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...VARIANTS[variant],
      }}
    >
      {children}
    </span>
  )
}

// Helpers pour les statuts frequents
export function badgeStatutPaiement(statut: string) {
  const map: Record<string, BadgeVariant> = {
    paye: 'green', en_attente: 'amber', en_retard: 'red', exonere: 'gray',
  }
  return map[statut] ?? 'gray'
}

export function badgeStatutProjet(statut: string) {
  const map: Record<string, BadgeVariant> = {
    demarrage: 'blue', en_cours: 'amber', termine: 'green', suspendu: 'red',
  }
  return map[statut] ?? 'gray'
}

export function badgeStatutCourrier(statut: string) {
  const map: Record<string, BadgeVariant> = {
    en_attente: 'amber', en_cours: 'blue', traite: 'green', archive: 'gray',
  }
  return map[statut] ?? 'gray'
}

export function badgeStatutAgent(statut: string) {
  const map: Record<string, BadgeVariant> = {
    actif: 'green', conge: 'amber', suspendu: 'red', quitte: 'gray',
  }
  return map[statut] ?? 'gray'
}

export function badgeStatutParcelle(statut: string) {
  const map: Record<string, BadgeVariant> = {
    titree: 'green', en_cours: 'amber', litige: 'red', libre: 'gray',
  }
  return map[statut] ?? 'gray'
}

export function badgeStatutMarche(statut: string) {
  const map: Record<string, BadgeVariant> = {
    preparation: 'gray', ouvert: 'blue', attribue: 'info',
    en_cours: 'amber', termine: 'green', annule: 'red',
  }
  return map[statut] ?? 'gray'
}

export function badgeTypeActe(type: string) {
  const map: Record<string, BadgeVariant> = {
    naissance: 'blue', mariage: 'green', deces: 'gray',
  }
  return map[type] ?? 'gray'
}
