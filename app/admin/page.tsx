'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' 
import { Users, Shield, Trash2, Edit, Save, Plus, X, Loader2 } from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Lista de Usuários Reais
  const [usersList, setUsersList] = useState<any[]>([]) 
  
  // Estado do Formulário
  const initialFormState = { id: '', name: '', email: '', password: '', role: 'user' }
  const [formData, setFormData] = useState(initialFormState)
  const [isEditing, setIsEditing] = useState(false) // Controla se estamos editando ou criando

  // --- 1. PROTEÇÃO E CARREGAMENTO ---
  useEffect(() => {
    const init = async () => {
      // Verifica Admin
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || (session.user.email !== 'admin@empresa.com' && !session.user.email?.includes('admin'))) {
        router.push('/')
        return
      }

      // Busca Usuários Reais da API
      await fetchUsers()
      setLoading(false)
    }
    init()
  }, [router])

  // --- 2. FUNÇÕES DE API ---
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users') // Chama o GET
      const data = await res.json()
      if (Array.isArray(data)) setUsersList(data)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const method = isEditing ? 'PUT' : 'POST' // Decide se cria ou edita
      
      const response = await fetch('/api/admin/users', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro na operação')

      alert(isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
      
      // Recarrega a lista e limpa o form
      await fetchUsers()
      handleCancelEdit()

    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Tem certeza absoluta? Essa ação não pode ser desfeita.')) return

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao deletar')
      
      // Remove da lista visualmente
      setUsersList(usersList.filter(u => u.id !== id))
    } catch (error) {
      alert('Erro ao deletar usuário')
    }
  }

  // --- 3. HELPER DO FORMULÁRIO ---
  const handleEditClick = (user: any) => {
    setIsEditing(true)
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Senha sempre vazia por segurança (só preenche se quiser trocar)
      role: user.role
    })
    // Rola para o formulário (útil em mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData(initialFormState)
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#5d4a2f]" /></div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5d4a2f]">Gestão de Acessos</h1>
          <p className="text-sm text-gray-500">Controle total de usuários do sistema</p>
        </div>
        <div className="bg-[#5d4a2f] text-[#dedbcb] px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Shield size={16} /> Admin Master
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
        {/* --- FORMULÁRIO INTELIGENTE (Cria e Edita) --- */}
        <div className={`p-6 rounded-xl shadow-lg h-fit transition-colors duration-300 ${isEditing ? 'bg-blue-900 text-white' : 'bg-[#5d4a2f] text-[#dedbcb]'}`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            {isEditing ? <Edit size={20} /> : <Plus size={20} />} 
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold opacity-70 uppercase">Nome Completo</label>
              <input 
                type="text" required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-black/20 border border-white/20 rounded p-2 focus:outline-none focus:border-white transition-colors placeholder-white/50"
                placeholder="Ex: João da Silva"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold opacity-70 uppercase">E-mail de Acesso</label>
              <input 
                type="email" required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-black/20 border border-white/20 rounded p-2 focus:outline-none focus:border-white transition-colors placeholder-white/50"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold opacity-70 uppercase flex justify-between">
                {isEditing ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
                {isEditing && <span className="text-[10px] opacity-70 lowercase font-normal">deixe vazio para manter a atual</span>}
              </label>
              <input 
                type="password" 
                required={!isEditing} // Obrigatório só ao criar
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="w-full bg-black/20 border border-white/20 rounded p-2 focus:outline-none focus:border-white transition-colors placeholder-white/50"
                placeholder={isEditing ? "••••••••" : "Mínimo 6 caracteres"}
              />
            </div>

            <div>
              <label className="text-xs font-bold opacity-70 uppercase">Nível de Permissão</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
                className="w-full bg-black/20 border border-white/20 rounded p-2 focus:outline-none focus:border-white transition-colors [&>option]:text-black cursor-pointer"
              >
                <option value="user">Usuário Comum (Vendas/Prod)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-white text-[#5d4a2f] font-bold py-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : (isEditing ? 'Salvar Alterações' : 'Criar Acesso')}
              </button>
              
              {isEditing && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors"
                  title="Cancelar Edição"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- LISTA DE USUÁRIOS --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5d4a2f]">
            <Users size={20} /> Lista de Usuários ({usersList.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9f8f6] text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Nome / Email</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-400">Carregando ou nenhum usuário encontrado...</td></tr>
                )}
                
                {usersList.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{u.name}</div>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                        {u.role === 'admin' ? 'ADMIN' : 'USUÁRIO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}