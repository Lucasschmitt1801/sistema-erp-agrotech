'use client'

import { useEffect, useState } from 'react'
// Ajuste o caminho do import conforme necessário
import { supabase } from '@/lib/supabase'
import { UserPlus, Users, Shield, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novoUser, setNovoUser] = useState({ email: '', password: '', role: 'user' })
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    verificarAcesso()
  }, [])

  async function verificarAcesso() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        router.push('/login')
        return
    }

    // Busca o perfil para ver se é admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (profile?.role !== 'admin') {
        alert('Acesso Negado: Área restrita para administradores.')
        router.push('/') // Chuta para a home
        return
    }

    // Se chegou aqui, é admin
    fetchUsuarios()
  }

  async function fetchUsuarios() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsuarios(data)
    setLoading(false)
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setCriando(true)

    try {
        const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(novoUser)
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)

        alert('Usuário criado com sucesso!')
        setNovoUser({ email: '', password: '', role: 'user' })
        fetchUsuarios()

    } catch (error: any) {
        alert('Erro: ' + error.message)
    } finally {
        setCriando(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-[#5d4a2f]"><Loader2 className="animate-spin mr-2"/> Verificando permissões...</div>

  return (
    <div className="max-w-6xl mx-auto text-[#5d4a2f]">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Shield className="text-[#8f7355]"/> Painel do Administrador
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#dedbcb] lg:col-span-1 h-fit">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#5d4a2f]">
                <UserPlus size={20}/> Cadastrar Novo Acesso
            </h2>
            <form onSubmit={criarUsuario} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">E-mail</label>
                    <input 
                        type="email" required
                        className="w-full border p-2 rounded focus:border-[#8f7355] outline-none text-gray-900"
                        value={novoUser.email}
                        onChange={e => setNovoUser({...novoUser, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Senha Provisória</label>
                    <input 
                        type="text" required minLength={6}
                        className="w-full border p-2 rounded focus:border-[#8f7355] outline-none text-gray-900"
                        value={novoUser.password}
                        onChange={e => setNovoUser({...novoUser, password: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Função</label>
                    <select 
                        className="w-full border p-2 rounded bg-white text-gray-900"
                        value={novoUser.role}
                        onChange={e => setNovoUser({...novoUser, role: e.target.value})}
                    >
                        <option value="user">Usuário (Cliente/Funcionário)</option>
                        <option value="admin">Administrador (Total)</option>
                    </select>
                </div>
                
                <button disabled={criando} className="w-full bg-[#5d4a2f] text-white p-3 rounded font-bold hover:bg-[#4a3b25] transition-colors mt-4">
                    {criando ? 'Criando...' : 'Cadastrar Usuário'}
                </button>
            </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#5d4a2f]">
                <Users size={20}/> Usuários do Sistema
            </h2>
            <div className="space-y-3">
                {usuarios.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 bg-[#f9f8f6] rounded-lg border border-[#dedbcb]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-[#5d4a2f] text-white' : 'bg-white text-[#8f7355] border border-[#dedbcb]'}`}>
                                {u.role === 'admin' ? <Shield size={16}/> : <Users size={16}/>}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[#5d4a2f]">{u.email}</p>
                                <p className="text-xs text-gray-400">ID: {u.id.slice(0,8)}...</p>
                            </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-[#dedbcb] text-[#5d4a2f]' : 'bg-green-100 text-green-700'}`}>
                            {u.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  )
}