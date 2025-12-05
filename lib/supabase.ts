import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase (URL ou ANON KEY). Verifique seu arquivo .env.local')
}

// Cria a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseKey)