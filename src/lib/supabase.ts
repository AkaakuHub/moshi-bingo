import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          host_id: string | null
          name: string
          status: 'waiting' | 'playing' | 'finished'
          current_number: number | null
          drawn_numbers: number[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          host_id?: string | null
          name: string
          status?: 'waiting' | 'playing' | 'finished'
          current_number?: number | null
          drawn_numbers?: number[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          host_id?: string | null
          name?: string
          status?: 'waiting' | 'playing' | 'finished'
          current_number?: number | null
          drawn_numbers?: number[]
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          name: string
          role: 'host' | 'participant'
          game_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          role?: 'host' | 'participant'
          game_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          role?: 'host' | 'participant'
          game_id?: string | null
        }
      }
      bingo_cards: {
        Row: {
          id: string
          created_at: string
          user_id: string
          game_id: string
          numbers: number[][]
          marked_cells: boolean[][]
          has_bingo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          game_id: string
          numbers: number[][]
          marked_cells?: boolean[][]
          has_bingo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          game_id?: string
          numbers?: number[][]
          marked_cells?: boolean[][]
          has_bingo?: boolean
        }
      }
      game_events: {
        Row: {
          id: string
          created_at: string
          game_id: string
          event_type: string
          data: Record<string, unknown>
        }
        Insert: {
          id?: string
          created_at?: string
          game_id: string
          event_type: string
          data?: Record<string, unknown>
        }
        Update: {
          id?: string
          created_at?: string
          game_id?: string
          event_type?: string
          data?: Record<string, unknown>
        }
      }
    }
  }
}