'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Package, Truck, Check } from 'lucide-react'

export default function Envios() {
  const [envios, setEnvios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novoEnvio, setNovoEnvio] = useState({ cliente: '', rastreio: '', conteudo: '' })

  useEffect(() => { fetchEnvios() }, [])

  async function fetchEnvios() {
    setLoading(true)
    const { data } = await supabase.from('envios').select('*').order('created_at', { ascending: false })
    if (data) setEnvios(data)
    setLoading(false)
  }

  async function salvarEnvio(e: React.FormEvent) {
    e.preventDefault()
    if (!novoEnvio.cliente) return

    await supabase.from('envios').insert([{
      cliente_nome: novoEnvio.cliente,
      codigo_rastreio: novoEnvio.rastreio,
      conteudo: novoEnvio.conteudo,
      status: 'PENDENTE'
    }])
    setNovoEnvio({ cliente: '', rastreio: '', conteudo: '' })
    fetchEnvios()
  }

  async function marcarEnviado(id: string) {
    await supabase.from('envios').update({ status: 'ENVIADO' }).eq('id', id)
    fetchEnvios()
  }

  return (
    <div className="max-w-4xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Truck className="text-blue-600"/> Controle de Envios Online
      </h1>

      {/* Formulário Novo Envio */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Novo Pacote</h2>
        <form onSubmit={salvarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500">Cliente</label>
            <input 
              className="w-full p-2 border rounded text-gray-900" 
              placeholder="Nome do Cliente"
              value={novoEnvio.cliente}
              onChange={e => setNovoEnvio({...novoEnvio, cliente: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500">Conteúdo</label>
            <input 
              className="w-full p-2 border rounded text-gray-900" 
              placeholder="Ex: 2 Cintos"
              value={novoEnvio.conteudo}
              onChange={e => setNovoEnvio({...novoEnvio, conteudo: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500">Rastreio (Correios)</label>
            <input 
              className="w-full p-2 border rounded text-gray-900 uppercase" 
              placeholder="OH123456789BR"
              value={novoEnvio.rastreio}
              onChange={e => setNovoEnvio({...novoEnvio, rastreio: e.target.value})}
            />
          </div>
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
            <Plus size={18} /> Cadastrar
          </button>
        </form>
      </div>

      {/* Lista de Envios */}
      <div className="space-y-3">
        {envios.map(item => (
           <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-full ${item.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{item.cliente_nome}</h3>
                    <p className="text-sm text-gray-500">{item.conteudo}</p>
                    {item.codigo_rastreio && (
                        <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block text-gray-700">
                            {item.codigo_rastreio}
                        </p>
                    )}
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {item.status}
                </span>
                {item.status === 'PENDENTE' && (
                    <button 
                        onClick={() => marcarEnviado(item.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                    >
                        <Check size={16} /> Marcar Enviado
                    </button>
                )}
             </div>
           </div>
        ))}
        {envios.length === 0 && !loading && <p className="text-center text-gray-400">Nenhum envio cadastrado.</p>}
      </div>
    </div>
  )
}