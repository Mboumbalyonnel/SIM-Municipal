import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SIM Gamba — Systeme de gestion municipale',
  description: 'Systeme d\'Information Municipal — Mairie de Gamba',
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
