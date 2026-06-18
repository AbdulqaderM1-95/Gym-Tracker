'use client'

import { useEffect, useState } from 'react'
import { supabase, type Exercise, type Category } from '@/lib/supabase'

const CATEGORIES: Category[] = ['push', 'pull', 'legs']

interface SetEntry {
  exerciseName: string
  muscleTargeted: string
  weight: string
  reps: string
  setNumber: number
}

export default function LogPage() {
  const [category, setCategory] = useState<Category>('push')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [sets, setSets] = useState<SetEntry[]>([])

  // Form state
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [customMuscle, setCustomMuscle] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => setExercises(data ?? []))
  }, [])

  const filteredExercises = exercises.filter((e) => e.category === category)

  const currentExercise = selectedExercise === '__custom__'
    ? null
    : exercises.find((e) => e.id === selectedExercise)

  function addSet() {
    const name = selectedExercise === '__custom__' ? customExercise.trim() : currentExercise?.name ?? ''
    const muscle = selectedExercise === '__custom__' ? customMuscle.trim() : currentExercise?.muscle_targeted ?? ''
    if (!name || !reps) return

    const existingCount = sets.filter((s) => s.exerciseName === name).length
    setSets((prev) => [
      ...prev,
      { exerciseName: name, muscleTargeted: muscle, weight, reps, setNumber: existingCount + 1 },
    ])
    setWeight('')
    setReps('')
  }

  function removeSet(idx: number) {
    setSets((prev) => prev.filter((_, i) => i !== idx))
  }

  async function finishSession() {
    if (sets.length === 0) return
    setSaving(true)

    const today = new Date().toISOString().split('T')[0]
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({ session_date: today, category })
      .select()
      .single()

    if (error || !session) { setSaving(false); alert('Error saving session'); return }

    const rows = sets.map((s) => ({
      session_id: session.id,
      exercise_name: s.exerciseName,
      muscle_targeted: s.muscleTargeted,
      category,
      weight: s.weight ? parseFloat(s.weight) : null,
      reps: parseInt(s.reps),
      set_number: s.setNumber,
    }))

    await supabase.from('workout_sets').insert(rows)
    setSets([])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const groupedSets = sets.reduce<Record<string, SetEntry[]>>((acc, s) => {
    if (!acc[s.exerciseName]) acc[s.exerciseName] = []
    acc[s.exerciseName].push(s)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e1e', paddingBottom: 24 }}>
        <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
          Log Workout
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', color: '#fff' }}>
          NEW SESSION
        </h1>
      </div>

      {/* Category selector */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: 12 }}>
          Session Type
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`filter-btn${category === c ? ' active' : ''}`}
              onClick={() => { setCategory(c); setSelectedExercise(''); setCustomExercise(''); setCustomMuscle('') }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Add set form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444' }}>
            Add Set
          </div>

          {/* Exercise picker */}
          <div>
            <label style={labelStyle}>Exercise</label>
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
              <option value="">— Select exercise —</option>
              {filteredExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.muscle_targeted})
                </option>
              ))}
              <option value="__custom__">+ Custom exercise</option>
            </select>
          </div>

          {selectedExercise === '__custom__' && (
            <>
              <div>
                <label style={labelStyle}>Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cable Fly"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Muscle Targeted</label>
                <input
                  type="text"
                  placeholder="e.g. Chest"
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Reps *</label>
              <input
                type="number"
                placeholder="0"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-ghost"
            onClick={addSet}
            disabled={!selectedExercise || !reps || (selectedExercise === '__custom__' && !customExercise)}
            style={{ width: '100%' }}
          >
            + Add Set
          </button>
        </div>

        {/* Sets logged */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#444',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Sets Logged</span>
            <span style={{ color: '#333' }}>{sets.length} sets</span>
          </div>

          {sets.length === 0 ? (
            <div
              style={{
                border: '1px dashed #1e1e1e',
                padding: '32px 20px',
                textAlign: 'center',
                color: '#333',
                fontSize: 12,
                letterSpacing: '0.06em',
              }}
            >
              No sets added yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#1a1a1a' }}>
              {Object.entries(groupedSets).map(([exName, exSets]) => (
                <div key={exName} style={{ background: '#000' }}>
                  <div
                    style={{
                      padding: '10px 16px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#ccc',
                      background: '#0d0d0d',
                      borderBottom: '1px solid #1a1a1a',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{exName}</span>
                    <span style={{ color: '#444', fontSize: 10 }}>{exSets[0].muscleTargeted}</span>
                  </div>
                  {exSets.map((s, idx) => {
                    const globalIdx = sets.indexOf(s)
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          borderBottom: '1px solid #0d0d0d',
                        }}
                      >
                        <span style={{ color: '#333', fontSize: 10, width: 20, textAlign: 'center' }}>
                          {s.setNumber}
                        </span>
                        <span style={{ color: '#888', fontSize: 13, flex: 1 }}>
                          {s.weight ? `${s.weight} kg` : 'BW'} × {s.reps}
                        </span>
                        <button className="btn-danger" onClick={() => removeSet(globalIdx)}>✕</button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Finish */}
      <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="btn-primary"
          onClick={finishSession}
          disabled={sets.length === 0 || saving}
        >
          {saving ? 'Saving...' : 'Finish Session'}
        </button>
        {saved && (
          <span style={{ color: '#555', fontSize: 12, letterSpacing: '0.08em' }}>
            Session saved.
          </span>
        )}
        {sets.length > 0 && !saving && !saved && (
          <span style={{ color: '#333', fontSize: 12 }}>
            {sets.length} set{sets.length > 1 ? 's' : ''} ready to save
          </span>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#555',
  marginBottom: 6,
}
