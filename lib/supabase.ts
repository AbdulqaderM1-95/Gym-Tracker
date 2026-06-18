import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = 'push' | 'pull' | 'legs'

export interface Exercise {
  id: string
  name: string
  category: Category
  muscle_targeted: string
  created_at: string
}

export interface WorkoutSession {
  id: string
  session_date: string
  category: Category
  notes: string | null
  created_at: string
  workout_sets?: WorkoutSet[]
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_name: string
  muscle_targeted: string
  category: Category
  weight: number | null
  reps: number
  set_number: number
  created_at: string
}
