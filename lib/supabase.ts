import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificação de Segurança (Debug)
if (!supabaseUrl || !supabaseKey) {
  console.error('ALERTA CRÍTICO: Variáveis de ambiente do Supabase não encontradas!')
  console.log('URL:', supabaseUrl)
  console.log('KEY:', supabaseKey ? 'Definida' : 'Indefinida')
}

// Garante que não quebre a aplicação se as chaves não existirem (usa string vazia temporária)
// Mas o erro "No API key" continuará até você arrumar o arquivo .env
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
)