'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' 
import { Users, Shield, Trash2, Plus, Loader2 } from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('users') 
  
  // Estado para formulário
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' })
  
  // Lista de usuários
  const [usersList, setUsersList] = useState<any[]>([]) 

  // --- PROTEÇÃO DE ADMIN ---
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || (session.user.email !== 'admin@empresa.com' && !session.user.email?.includes('admin'))) {
        router.push('/')
      } else {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  // --- HANDLER DE CRIAÇÃO REAL (CORRIGIDO) ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      alert('Usuário criado com sucesso!')
      
      // --- AQUI ESTAVA O ERRO, AGORA CORRIGIDO ---
      // A resposta vem como { user: { ... } }, então acessamos data.user diretamente
      if (data.user) {
        setUsersList([...usersList, { 
          id: data.user.id, 
          name: newUser.name, 
          email: newUser.email, 
          role: newUser.role, 
          status: 'active' 
        }])
      }
      
      setNewUser({ name: '', email: '', password: '', role: 'user' })

    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = (id: number) => {
    if(confirm('Tem certeza? (Isso é apenas visual por enquanto)')) {
      setUsersList(usersList.filter(u => u.id !== id))
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#5d4a2f]" /></div>

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5d4a2f]">Administração</h1>
          <p className="text-sm text-gray-500">Gestão de acessos</p>
        </div>
        <div className="bg-[#5d4a2f] text-[#dedbcb] px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Shield size={16} /> Modo Super Usuário
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
        {/* LISTA (Visual) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]"><Users size={20} /> Usuários Novos (Sessão)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9f8f6] text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Função</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum usuário criado agora.</td></tr>}
                {usersList.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORMULÁRIO REAL */}
        <div className="bg-[#5d4a2f] text-[#dedbcb] p-6 rounded-xl shadow-lg h-fit">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><Plus size={20} /> Novo Acesso Real</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-xs font-bold opacity-70">Nome</label>
              <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70">Email</label>
              <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70">Senha</label>
              <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70">Permissão</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-white">
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isCreating}
              className="w-full bg-[#dedbcb] text-[#5d4a2f] font-bold py-2 rounded mt-4 hover:bg-white transition-colors disabled:opacity-50 flex justify-center"
            >
              {isCreating ? <Loader2 className="animate-spin" /> : 'Criar Usuário'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}