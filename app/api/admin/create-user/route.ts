import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Recebe os dados do Front-end
    const body = await request.json()
    const { email, password, name, role } = body

    // 2. Cria um cliente Supabase com SUPER PODERES (Service Role)
    // Isso permite criar usuário sem estar logado como aquele usuário
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Cria o usuário no sistema de Auth do Supabase
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Já cria confirmado, sem precisar clicar no email
      user_metadata: { 
        name: name,
        role: role // Salva se é admin ou user nos metadados
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // 4. (Opcional) Se você tiver uma tabela 'users' no banco de dados além do Auth,
    // você deve inserir nela aqui também. Se não tiver, pode pular.
    
    return NextResponse.json({ message: 'Usuário criado com sucesso!', user }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}