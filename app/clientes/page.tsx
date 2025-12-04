'use client'

import { useEffect, useState } from 'react'
// Caminho ajustado para garantir que encontre o arquivo
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, User, MapPin, Eye } from 'lucide-react'
import Link from 'next/link'

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
    if (confirm('Excluir cliente? Isso também apagará o histórico de pedidos dele.')) {
      await supabase.from('clientes').delete().match({ id })
      fetchClientes()
    }
  }

  return (
    <div className="max-w-5xl mx-auto text-[#5d4a2f]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-[#8f7355]" /> Carteira de Clientes
        </h1>
        {view === 'LISTA' && (
          <button onClick={novoCliente} className="bg-[#8f7355] text-white px-4 py-2 rounded-lg flex gap-2 font-bold hover:bg-[#5d4a2f] transition-colors">
            <Plus size={20} /> Novo Cliente
          </button>
        )}
      </div>

      {view === 'LISTA' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-[#dedbcb] hover:border-[#8f7355] transition group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-[#5d4a2f]">{c.nome_empresa}</h3>
                <div className="flex gap-2">
                  {/* BOTÃO VER HISTÓRICO (NOVO) */}
                  <Link href={`/clientes/${c.id}`} className="text-green-600 hover:bg-green-50 p-1 rounded transition" title="Ver Histórico Completo">
                    <Eye size={16} />
                  </Link>

                  <button onClick={() => editarCliente(c)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition"><Edit size={16} /></button>
                  <button onClick={() => deletar(c.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">👤 {c.contato_nome} • {c.telefone}</p>
              <p className="text-sm text-gray-500 mb-3">📧 {c.email}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-[#f9f8f6] p-2 rounded border border-[#dedbcb]">
                <MapPin size={12} /> {c.cidade}/{c.estado}
              </div>
            </div>
          ))}
          {clientes.length === 0 && !loading && (
            <div className="col-span-3 text-center text-gray-400 py-10 bg-white rounded-xl border border-dashed border-gray-300">
                Nenhum cliente cadastrado.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={salvar} className="bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
          <h2 className="font-bold text-lg mb-4 text-[#5d4a2f]">Dados do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500">Nome da Empresa / Razão Social</label>
              <input required className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.nome_empresa} onChange={e => setFormData({ ...formData, nome_empresa: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">CNPJ / CPF</label>
              <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.cnpj_cpf} onChange={e => setFormData({ ...formData, cnpj_cpf: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Nome do Contato</label>
              <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.contato_nome} onChange={e => setFormData({ ...formData, contato_nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Telefone / WhatsApp</label>
              <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500">Email</label>
              <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-4">
               <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-500">Endereço</label>
                 <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500">Cidade/UF</label>
                 <div className="flex gap-2">
                   <input className="w-full border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" placeholder="Cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                   <input className="w-16 border p-2 rounded text-gray-900 bg-white focus:border-[#8f7355] outline-none" placeholder="UF" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} />
                 </div>
               </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setView('LISTA')} className="flex-1 border p-3 rounded text-gray-600 hover:bg-[#f9f8f6]">Cancelar</button>
            <button type="submit" className="flex-1 bg-[#8f7355] text-white p-3 rounded font-bold hover:bg-[#5d4a2f] transition-colors">Salvar Cliente</button>
          </div>
        </form>
      )}
    </div>
  )
}