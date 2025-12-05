'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// CORREÇÃO: Volta duas pastas (admin -> app -> src) para achar a lib
import { supabase } from '../../lib/supabase' 
import { 
  Users, Shield, Activity, Trash2, Plus 
} from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users') 

  // Estado para formulário de novo usuário
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' })

  // Mock de usuários
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Administrador', email: 'admin@empresa.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Vendedor Loja', email: 'vendedor@haras.com', role: 'user', status: 'active' },
  ])

  // --- PROTEÇÃO DE ADMIN ---
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Verifica se existe sessão e se o email contém "admin"
      if (!session || (session.user.email !== 'admin@empresa.com' && !session.user.email?.includes('admin'))) {
        router.push('/') // Expulsa se não for admin
      } else {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  // --- HANDLERS ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Simulação: Criando usuário ${newUser.email}...`)
    
    setUsersList([...usersList, { 
      id: Date.now(), 
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role, 
      status: 'pending' 
    }])
    setNewUser({ name: '', email: '', password: '', role: 'user' })
  }

  const handleDeleteUser = (id: number) => {
    if(confirm('Tem certeza que deseja remover este acesso?')) {
      setUsersList(usersList.filter(u => u.id !== id))
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando painel administrativo...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5d4a2f]">Administração do Sistema</h1>
          <p className="text-sm text-gray-500">Controle de usuários e configurações globais</p>
        </div>
        <div className="bg-[#5d4a2f] text-[#dedbcb] px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Shield size={16} /> Modo Super Usuário
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 font-medium ${activeTab === 'users' ? 'text-[#5d4a2f] border-b-2 border-[#5d4a2f]' : 'text-gray-400'}`}>Gerenciar Usuários</button>
        <button onClick={() => setActiveTab('overview')} className={`pb-3 px-2 font-medium ${activeTab === 'overview' ? 'text-[#5d4a2f] border-b-2 border-[#5d4a2f]' : 'text-gray-400'}`}>Logs do Sistema</button>
      </div>

      {/* CONTEÚDO */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LISTA */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]"><Users size={20} /> Usuários</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f9f8f6] text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Função</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                      <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <div className="bg-[#5d4a2f] text-[#dedbcb] p-6 rounded-xl shadow-lg h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><Plus size={20} /> Novo Acesso</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" required placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white" />
              <input type="email" required placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white" />
              <input type="password" required placeholder="Senha" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white" />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="w-full bg-[#dedbcb] text-[#5d4a2f] font-bold py-2 rounded mt-4 hover:bg-white transition-colors">Criar</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-xl border border-[#dedbcb]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]"><Activity size={20} /> Logs</h3>
          <p className="text-gray-500 text-sm">Registro de atividades recentes do sistema...</p>
        </div>
      )}
    </div>
  )
}