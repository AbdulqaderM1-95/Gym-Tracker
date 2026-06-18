'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type WorkoutSession, type Category } from '@/lib/supabase'
import SupermanShield from '@/components/SupermanShield'

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
]

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecent()
  }, [])

  async function fetchRecent() {
    setLoading(true)
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .order('session_date', { ascending: false })
      .limit(20)
    setSessions(data ?? [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.category === filter)
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter((s) => s.session_date === today)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Hero */}
      <div
        style={{
          borderBottom: '1px solid #1e1e1e',
          paddingBottom: 32,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <SupermanShield size={48} />
            <div>
              <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
                Steel. Discipline. Power.
              </p>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  color: '#fff',
                }}
              >
                FORTRESS
              </h1>
            </div>
          </div>
          <p style={{ color: '#555', fontSize: 12, letterSpacing: '0.08em' }}>
            {todaySessions.length > 0
              ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} logged today`
              : "No workout logged today. Begin."}
          </p>
        </div>
        <Link href="/log" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          + Log Workout
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1e1e1e' }}>
        {[
          { label: 'Total Sessions', value: sessions.length },
          { label: 'This Week', value: sessions.filter((s) => {
            const d = new Date(s.session_date)
            const now = new Date()
            const weekAgo = new Date(now)
            weekAgo.setDate(now.getDate() - 7)
            return d >= weekAgo
          }).length },
          { label: 'Push / Pull / Legs', value: `${sessions.filter(s => s.category === 'push').length} / ${sessions.filter(s => s.category === 'pull').length} / ${sessions.filter(s => s.category === 'legs').length}` },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#000', padding: '20px 24px' }}>
            <div style={{ color: '#444', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Sessions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555' }}>
            Recent Sessions
          </h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`filter-btn${filter === c.value ? ' active' : ''}`}
                onClick={() => setFilter(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#333', fontSize: 13, letterSpacing: '0.06em', padding: '40px 0', textAlign: 'center' }}>
            LOADING...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#333', fontSize: 13, padding: '60px 0', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
            No sessions found. <Link href="/log" style={{ color: '#666', textDecoration: 'underline' }}>Log one now.</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#1a1a1a' }}>
            {filtered.map((session) => (
              <SessionRow key={session.id} session={session} onDelete={fetchRecent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionRow({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const sets = session.workout_sets ?? []
  const totalSets = sets.length
  const totalVolume = sets.reduce((acc, s) => acc + (s.weight ?? 0) * s.reps, 0)
  const date = new Date(session.session_date + 'T00:00:00')

  async function handleDelete() {
    if (!confirm('Delete this session?')) return
    await supabase.from('workout_sessions').delete().eq('id', session.id)
    onDelete()
  }

  return (
    <div
      style={{
        background: '#000',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <span className={`cat-pill ${session.category}`}>{session.category}</span>

      <div style={{ flex: 1 }}>
        {sets.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[...new Set(sets.map((s) => s.exercise_name))].slice(0, 4).map((name) => (
              <span
                key={name}
                style={{ fontSize: 12, color: '#777', background: '#0d0d0d', padding: '3px 10px', border: '1px solid #1e1e1e' }}
              >
                {name}
              </span>
            ))}
            {[...new Set(sets.map((s) => s.exercise_name))].length > 4 && (
              <span style={{ fontSize: 12, color: '#444' }}>
                +{[...new Set(sets.map((s) => s.exercise_name))].length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sets</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ccc' }}>{totalSets}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Volume</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ccc' }}>
            {totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '—'}
          </div>
        </div>
        <button className="btn-danger" onClick={handleDelete}>Del</button>
      </div>
    </div>
  )
}
