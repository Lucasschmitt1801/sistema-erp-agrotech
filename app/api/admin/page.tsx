'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' // Caminho voltando duas pastas (admin -> app -> src -> lib)
import { 
  Users, Shield, Activity, Settings, Save, Search, Trash2, Plus 
} from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users') // 'overview', 'users', 'settings'

  // Estado para formulário de novo usuário
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' })

  // Mock de usuários (Futuramente virá do banco)
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Administrador', email: 'admin@empresa.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Vendedor Loja', email: 'vendedor@haras.com', role: 'user', status: 'active' },
    { id: 3, name: 'Gerente Produção', email: 'producao@haras.com', role: 'user', status: 'active' },
  ])

  // --- 1. PROTEÇÃO RÍGIDA DE ADMIN ---
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Se não tiver sessão ou o email não for de admin, expulsa
      if (!session || (session.user.email !== 'admin@empresa.com' && !session.user.email?.includes('admin'))) {
        router.push('/') // Manda de volta para o dashboard comum
      } else {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  // --- HANDLERS ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui virá a chamada para a API de criação real
    alert(`Simulação: Criando usuário ${newUser.email}... \n(Para criar usuários reais sem deslogar, precisamos configurar a API Route)`)
    
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
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d4a2f]"></div>
      </div>
    )
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

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'users' ? 'text-[#5d4a2f] border-b-2 border-[#5d4a2f]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Gerenciar Usuários
        </button>
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'overview' ? 'text-[#5d4a2f] border-b-2 border-[#5d4a2f]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Logs do Sistema
        </button>
      </div>

      {/* CONTEÚDO: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LISTA DE USUÁRIOS */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]">
              <Users size={20} /> Usuários Cadastrados
            </h3>
            
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
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FORMULÁRIO DE NOVO USUÁRIO */}
          <div className="bg-[#5d4a2f] text-[#dedbcb] p-6 rounded-xl shadow-lg h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
              <Plus size={20} /> Novo Acesso
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold mb-1 opacity-80">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-[#dedbcb]"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold mb-1 opacity-80">E-mail Corporativo</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-[#dedbcb]"
                  placeholder="usuario@haras.com"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold mb-1 opacity-80">Senha Provisória</label>
                <input 
                  type="password" 
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-[#dedbcb]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold mb-1 opacity-80">Nível de Acesso</label>
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full bg-[#4e3d26] border border-[#755f40] rounded p-2 text-white focus:outline-none focus:border-[#dedbcb]"
                >
                  <option value="user">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-[#dedbcb] text-[#5d4a2f] font-bold py-2 rounded mt-4 hover:bg-white transition-colors">
                Criar Usuário
              </button>
            </form>
          </div>

        </div>
      )}

      {/* CONTEÚDO: LOGS */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]">
            <Activity size={20} /> Logs de Segurança
          </h3>
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-600">Login realizado com sucesso (admin@empresa.com)</span>
                </div>
                <span className="text-gray-400 text-xs">Hoje, 10:{30 + i}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}