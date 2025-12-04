import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Cria um cliente Supabase com poderes de Super Admin (Service Role)
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

  try {
    const { email, password, role } = await req.json()

    // 1. Cria o usuário no sistema de Auth
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Já confirma o email automaticamente
    })

    if (error) throw error

    // 2. Atualiza a role na tabela de profiles (se for admin)
    if (role === 'admin' && user.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.user.id)
        
        if (profileError) throw profileError
    }

    return NextResponse.json({ message: 'Usuário criado com sucesso!', user })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}