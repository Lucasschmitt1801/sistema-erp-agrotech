'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Search, User, MapPin } from 'lucide-react'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('LISTA') // 'LISTA' ou 'FORM'
  const [formData, setFormData] = useState({ id: '', nome_empresa: '', contato_nome: '', telefone: '', email: '', cnpj_cpf: '', endereco: '', cidade: '', estado: '' })

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome_empresa')
    if (data) setClientes(data)
    setLoading(false)
  }

  function novoCliente() {
    setFormData({ id: '', nome_empresa: '', contato_nome: '', telefone: '', email: '', cnpj_cpf: '', endereco: '', cidade: '', estado: '' })
    setView('FORM')
  }

  function editarCliente(c: any) {
    setFormData(c)
    setView('FORM')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const dados = { ...formData }
    delete (dados as any).id // Remove ID para não dar erro no insert se for vazio

    if (formData.id) {
      await supabase.from('clientes').update(dados).eq('id', formData.id)
    } else {
      await supabase.from('clientes').insert(dados)
    }
    setView('LISTA')
    fetchClientes()
  }

  async function deletar(id: string) {
    if (confirm('Excluir cliente?')) {
      await supabase.from('clientes').delete().match({ id })
      fetchClientes()
    }
  }

  return (
    <div className="max-w-5xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-blue-600" /> Carteira de Clientes
        </h1>
        {view === 'LISTA' && (
          <button onClick={novoCliente} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 font-bold hover:bg-blue-700">
            <Plus size={20} /> Novo Cliente
          </button>
        )}
      </div>

      {view === 'LISTA' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{c.nome_empresa}</h3>
                <div className="flex gap-2">
                  <button onClick={() => editarCliente(c)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={16} /></button>
                  <button onClick={() => deletar(c.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">👤 {c.contato_nome} • {c.telefone}</p>
              <p className="text-sm text-gray-500 mb-3">📧 {c.email}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                <MapPin size={12} /> {c.cidade}/{c.estado}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={salvar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Dados do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500">Nome da Empresa / Razão Social</label>
              <input required className="w-full border p-2 rounded" value={formData.nome_empresa} onChange={e => setFormData({ ...formData, nome_empresa: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">CNPJ / CPF</label>
              <input className="w-full border p-2 rounded" value={formData.cnpj_cpf} onChange={e => setFormData({ ...formData, cnpj_cpf: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Nome do Contato</label>
              <input className="w-full border p-2 rounded" value={formData.contato_nome} onChange={e => setFormData({ ...formData, contato_nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Telefone / WhatsApp</label>
              <input className="w-full border p-2 rounded" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Email</label>
              <input className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-4">
               <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-500">Endereço</label>
                 <input className="w-full border p-2 rounded" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500">Cidade/UF</label>
                 <div className="flex gap-2">
                   <input className="w-full border p-2 rounded" placeholder="Cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                   <input className="w-16 border p-2 rounded" placeholder="UF" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} />
                 </div>
               </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setView('LISTA')} className="flex-1 border p-3 rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Salvar Cliente</button>
          </div>
        </form>
      )}
    </div>
  )
}