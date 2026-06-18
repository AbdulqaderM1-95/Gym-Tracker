'use client'

import { useEffect, useState } from 'react'
import { supabase, type WorkoutSession, type WorkoutSet, type Category } from '@/lib/supabase'

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
]

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .order('session_date', { ascending: false })
    setSessions(data ?? [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.category === filter)

  // Group by month
  const grouped: Record<string, WorkoutSession[]> = {}
  filtered.forEach((s) => {
    const d = new Date(s.session_date + 'T00:00:00')
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e1e', paddingBottom: 24 }}>
        <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
          Training Log
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', color: '#fff' }}>
          HISTORY
        </h1>
      </div>

      {/* Filter */}
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

      {/* Sessions */}
      {loading ? (
        <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', letterSpacing: '0.1em', fontSize: 12 }}>
          LOADING...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
          No sessions found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(grouped).map(([month, monthSessions]) => (
            <div key={month}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#444',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                {month} · {monthSessions.length} session{monthSessions.length > 1 ? 's' : ''}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#1a1a1a' }}>
                {monthSessions.map((session) => (
                  <SessionDetail
                    key={session.id}
                    session={session}
                    isExpanded={expanded === session.id}
                    onToggle={() => setExpanded(expanded === session.id ? null : session.id)}
                    onDelete={fetchAll}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionDetail({
  session,
  isExpanded,
  onToggle,
  onDelete,
}: {
  session: WorkoutSession
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const sets: WorkoutSet[] = session.workout_sets ?? []
  const date = new Date(session.session_date + 'T00:00:00')
  const totalVolume = sets.reduce((acc, s) => acc + (s.weight ?? 0) * s.reps, 0)

  const grouped: Record<string, WorkoutSet[]> = {}
  sets.forEach((s) => {
    if (!grouped[s.exercise_name]) grouped[s.exercise_name] = []
    grouped[s.exercise_name].push(s)
  })

  async function handleDelete() {
    if (!confirm('Delete this session?')) return
    await supabase.from('workout_sessions').delete().eq('id', session.id)
    onDelete()
  }

  return (
    <div style={{ background: '#000' }}>
      {/* Row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          textAlign: 'left',
        }}
      >
        <div style={{ minWidth: 70 }}>
          <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <span className={`cat-pill ${session.category}`}>{session.category}</span>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.keys(grouped).slice(0, 3).map((name) => (
            <span key={name} style={{ fontSize: 11, color: '#666', background: '#0d0d0d', padding: '2px 8px', border: '1px solid #1a1a1a' }}>
              {name}
            </span>
          ))}
          {Object.keys(grouped).length > 3 && (
            <span style={{ fontSize: 11, color: '#444' }}>+{Object.keys(grouped).length - 3} more</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sets</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#aaa' }}>{sets.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Volume</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#aaa' }}>
              {totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '—'}
            </div>
          </div>
          <span style={{ color: '#333', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #0d0d0d', padding: '0 0 16px 0' }}>
          {Object.entries(grouped).map(([exName, exSets]) => {
            const bestSet = exSets.reduce((best, s) => (!best.weight || (s.weight ?? 0) > (best.weight ?? 0) ? s : best), exSets[0])
            return (
              <div key={exName} style={{ padding: '16px 20px', borderBottom: '1px solid #0a0a0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ddd', letterSpacing: '0.02em' }}>{exName}</span>
                    <span style={{ fontSize: 10, color: '#444', marginLeft: 10, letterSpacing: '0.08em' }}>{exSets[0].muscle_targeted}</span>
                  </div>
                  {bestSet.weight && (
                    <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>
                      Best: {bestSet.weight} kg × {bestSet.reps}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {exSets.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        color: '#777',
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        padding: '4px 12px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {s.weight ? `${s.weight}kg` : 'BW'} × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          <div style={{ padding: '12px 20px 0' }}>
            <button className="btn-danger" onClick={handleDelete}>Delete Session</button>
          </div>
        </div>
      )}
    </div>
  )
}
