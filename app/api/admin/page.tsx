'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserPlus, Users, Shield, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novoUser, setNovoUser] = useState({ email: '', password: '', role: 'user' })
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    checarPermissaoEBuscar()
  }, [])

  async function checarPermissaoEBuscar() {
    // Verifica se quem está logado é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    
    if (profile?.role !== 'admin') {
        alert('Acesso Negado: Apenas administradores.')
        window.location.href = '/' // Chuta pra home
        return
    }

    fetchUsuarios()
  }

  async function fetchUsuarios() {
    // Busca perfis
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsuarios(data)
    setLoading(false)
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setCriando(true)

    try {
        // Chama nossa API secreta
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

  if (loading) return <div className="p-10 text-center">Verificando credenciais...</div>

  return (
    <div className="max-w-6xl mx-auto text-[#5d4a2f]">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Shield className="text-[#8f7355]"/> Painel do Administrador
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Criação */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#dedbcb] lg:col-span-1 h-fit">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#5d4a2f]">
                <UserPlus size={20}/> Novo Usuário
            </h2>
            <form onSubmit={criarUsuario} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">E-mail de Acesso</label>
                    <input 
                        type="email" required
                        className="w-full border p-2 rounded focus:border-[#8f7355] outline-none"
                        value={novoUser.email}
                        onChange={e => setNovoUser({...novoUser, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Senha Provisória</label>
                    <input 
                        type="text" required minLength={6}
                        className="w-full border p-2 rounded focus:border-[#8f7355] outline-none"
                        value={novoUser.password}
                        onChange={e => setNovoUser({...novoUser, password: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nível de Acesso</label>
                    <select 
                        className="w-full border p-2 rounded bg-white"
                        value={novoUser.role}
                        onChange={e => setNovoUser({...novoUser, role: e.target.value})}
                    >
                        <option value="user">Usuário Comum (Cliente)</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                
                <button disabled={criando} className="w-full bg-[#5d4a2f] text-white p-3 rounded font-bold hover:bg-[#4a3b25] transition-colors mt-4">
                    {criando ? 'Criando...' : 'Cadastrar Usuário'}
                </button>
            </form>
        </div>

        {/* Lista de Usuários */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#5d4a2f]">
                <Users size={20}/> Usuários Ativos ({usuarios.length})
            </h2>
            <div className="space-y-3">
                {usuarios.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 bg-[#f9f8f6] rounded-lg border border-[#dedbcb]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-[#5d4a2f] text-white' : 'bg-white text-[#8f7355] border'}`}>
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