'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Building } from 'lucide-react'

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState({
    id: '',
    nome_empresa: '',
    slogan: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    const { data } = await supabase.from('configuracao_empresa').select('*').single()
    if (data) setDados(data)
    setLoading(false)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Remove o ID do objeto para update se necessário, mas aqui vamos usar o ID para filtrar
    const { error } = await supabase
        .from('configuracao_empresa')
        .update({
            nome_empresa: dados.nome_empresa,
            slogan: dados.slogan,
            cnpj: dados.cnpj,
            endereco: dados.endereco,
            telefone: dados.telefone,
            email: dados.email
        })
        .eq('id', dados.id)

    if (!error) alert('Dados da empresa atualizados!')
    else alert('Erro ao salvar.')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Building className="text-blue-600"/> Dados da Minha Empresa
      </h1>
      
      <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
        <p className="text-sm text-gray-500 mb-6">Esses dados aparecerão no cabeçalho dos Orçamentos e PDFs.</p>
        
        <form onSubmit={salvar} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome da Empresa</label>
                <input className="w-full border p-2 rounded" value={dados.nome_empresa} onChange={e => setDados({...dados, nome_empresa: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Slogan / Subtítulo</label>
                    <input className="w-full border p-2 rounded" value={dados.slogan} onChange={e => setDados({...dados, slogan: e.target.value})} placeholder="Ex: Artigos de Couro" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">CNPJ</label>
                    <input className="w-full border p-2 rounded" value={dados.cnpj} onChange={e => setDados({...dados, cnpj: e.target.value})} />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Endereço Completo</label>
                <input className="w-full border p-2 rounded" value={dados.endereco} onChange={e => setDados({...dados, endereco: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Telefone / WhatsApp</label>
                    <input className="w-full border p-2 rounded" value={dados.telefone} onChange={e => setDados({...dados, telefone: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Email de Contato</label>
                    <input className="w-full border p-2 rounded" value={dados.email} onChange={e => setDados({...dados, email: e.target.value})} />
                </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 mt-4 flex justify-center gap-2">
                <Save size={20}/> {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </form>
      </div>
    </div>
  )
}