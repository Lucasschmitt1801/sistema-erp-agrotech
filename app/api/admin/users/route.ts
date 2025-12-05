import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Configuração do Cliente Admin (Service Role)
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

// 1. LISTAR USUÁRIOS (GET)
export async function GET() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) throw error

    // Formata os dados para o front-end
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Sem Nome',
      role: user.user_metadata?.role || 'user',
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at
    }))

    return NextResponse.json(formattedUsers, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 2. CRIAR USUÁRIO (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (error) throw error

    return NextResponse.json({ message: 'Criado', user: data.user }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// 3. EDITAR USUÁRIO (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, email, password, name, role } = body

    // Prepara objeto de atualização
    const updates: any = {
      email: email,
      user_metadata: { name, role }
    }

    // Só atualiza senha se ela for enviada (não vazia)
    if (password && password.trim() !== '') {
      updates.password = password
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates)

    if (error) throw error

    return NextResponse.json({ message: 'Atualizado', user: data.user }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// 4. DELETAR USUÁRIO (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) throw error

    return NextResponse.json({ message: 'Deletado' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}