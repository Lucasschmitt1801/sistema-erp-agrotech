import { createClient } from '@supabase/supabase-js'

// CHAVES HARDCODED (Para eliminar erro de leitura de ambiente)
const supabaseUrl = 'https://vfyghsvpdihkcfyvgwqs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeWdoc3ZwZGloa2NmeXZnd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0MzgsImV4cCI6MjA3OTk5NzQzOH0.Rn5D8NPO86XOmGTfjFmMjiBPWgk4szVZSB1Umo4Q528'

// Cria a conexão
export const supabase = createClient(supabaseUrl, supabaseKey)