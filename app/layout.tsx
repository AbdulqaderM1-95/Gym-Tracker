import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import SupermanShield from '@/components/SupermanShield'

export const metadata: Metadata = {
  title: 'FORTRESS | Gym Tracker',
  description: 'Superman-themed push pull legs workout tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#000', minHeight: '100vh' }}>
        {/* Header */}
        <header
          style={{
            borderBottom: '1px solid #1e1e1e',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 60,
            position: 'sticky',
            top: 0,
            background: '#000',
            zIndex: 50,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <SupermanShield size={28} />
            <span
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              FORTRESS
            </span>
          </Link>

          <nav style={{ display: 'flex', gap: 2 }}>
            <Link href="/" style={navStyle}>Dashboard</Link>
            <Link href="/log" style={navStyle}>Log</Link>
            <Link href="/history" style={navStyle}>History</Link>
          </nav>
        </header>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}

const navStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '8px 14px',
  transition: 'color 0.12s',
}
