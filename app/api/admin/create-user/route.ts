import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('--- Iniciando criação de usuário via API ---')

    // 1. Verificação de Segurança das Variáveis
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('ERRO CRÍTICO: Variáveis de ambiente não encontradas.')
      console.error('URL:', !!supabaseUrl)
      console.error('Service Key:', !!serviceRoleKey)
      
      return NextResponse.json({ 
        error: 'Erro de configuração no servidor. As chaves de API não foram carregadas.' 
      }, { status: 500 })
    }

    // 2. Recebe os dados do formulário
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
    }

    // 3. Cria o cliente Supabase com a chave Service Role (Super Admin)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 4. Tenta criar o usuário no Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Já cria com email confirmado
      user_metadata: { 
        name: name,
        role: role // 'admin' ou 'user'
      }
    })

    // 5. Tratamento de erro do Supabase
    if (error) {
      console.error('Erro retornado pelo Supabase:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Usuário criado com sucesso! ID:', data.user?.id)

    // 6. Retorno de Sucesso
    return NextResponse.json({ 
      message: 'Usuário criado com sucesso!', 
      user: data.user 
    }, { status: 200 })

  } catch (err: any) {
    console.error('Erro fatal não tratado:', err)
    return NextResponse.json({ 
      error: 'Erro interno no servidor: ' + (err.message || 'Desconhecido') 
    }, { status: 500 })
  }
}