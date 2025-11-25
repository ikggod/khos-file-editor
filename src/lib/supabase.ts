import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vornmactqtkaisubysau.supabase.co'
const supabaseKey = 'sb_publishable_KVvExNeA-ghHrJqJBxutwA_HqCqrK0e'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Message {
  id: string
  content: string
  created_at: string
}

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  created_at: string
}
