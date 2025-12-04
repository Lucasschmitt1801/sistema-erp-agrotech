'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Building, Tag, Plus, Trash2 } from 'lucide-react'

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  
  // Dados da Empresa
  const [dados, setDados] = useState({
    id: '', nome_empresa: '', slogan: '', cnpj: '', 
    endereco: '', telefone: '', email: ''
  })

  // Dados das Categorias
  const [categorias, setCategorias] = useState<any[]>([])
  const [novaCategoria, setNovaCategoria] = useState('')

  useEffect(() => {
    fetchConfig()
    fetchCategorias()
  }, [])

  async function fetchConfig() {
    const { data } = await supabase.from('configuracao_empresa').select('*').single()
    if (data) setDados(data)
    setLoading(false)
  }

  async function fetchCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('nome')
    if (data) setCategorias(data)
  }

  async function salvarEmpresa(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('configuracao_empresa').update(dados).eq('id', dados.id)
    if (!error) alert('Dados da empresa atualizados!')
    setLoading(false)
  }

  async function adicionarCategoria(e: React.FormEvent) {
    e.preventDefault()
    if (!novaCategoria) return

    const { error } = await supabase.from('categorias').insert([{ nome: novaCategoria }])
    if (error) {
        alert('Erro: Talvez essa categoria já exista.')
    } else {
        setNovaCategoria('')
        fetchCategorias()
    }
  }

  async function removerCategoria(id: string) {
    if(confirm('Tem certeza? Produtos com essa categoria não serão apagados, mas a categoria sumirá da lista de novos.')) {
        await supabase.from('categorias').delete().match({ id })
        fetchCategorias()
    }
  }

  return (
    <div className="max-w-5xl mx-auto text-[#5d4a2f]">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Building className="text-[#8f7355]"/> Configurações do Sistema
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- PAINEL 1: DADOS DA EMPRESA --- */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dedbcb]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#5d4a2f]">
                Dados da Empresa
            </h2>
            <form onSubmit={salvarEmpresa} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Nome da Empresa</label>
                    <input className="w-full border p-2 rounded text-gray-900 bg-white border-[#dedbcb] focus:border-[#8f7355] outline-none" 
                        value={dados.nome_empresa} onChange={e => setDados({...dados, nome_empresa: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Slogan</label>
                        <input className="w-full border p-2 rounded text-gray-900 border-[#dedbcb] outline-none" 
                            value={dados.slogan} onChange={e => setDados({...dados, slogan: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">CNPJ</label>
                        <input className="w-full border p-2 rounded text-gray-900 border-[#dedbcb] outline-none" 
                            value={dados.cnpj} onChange={e => setDados({...dados, cnpj: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Endereço Completo</label>
                    <input className="w-full border p-2 rounded text-gray-900 border-[#dedbcb] outline-none" 
                        value={dados.endereco} onChange={e => setDados({...dados, endereco: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Telefone</label>
                        <input className="w-full border p-2 rounded text-gray-900 border-[#dedbcb] outline-none" 
                            value={dados.telefone} onChange={e => setDados({...dados, telefone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Email</label>
                        <input className="w-full border p-2 rounded text-gray-900 border-[#dedbcb] outline-none" 
                            value={dados.email} onChange={e => setDados({...dados, email: e.target.value})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-[#8f7355] text-white p-3 rounded font-bold hover:bg-[#5d4a2f] mt-4 flex justify-center gap-2 transition-colors">
                    <Save size={20}/> {loading ? 'Salvando...' : 'Salvar Dados'}
                </button>
            </form>
        </div>

        {/* --- PAINEL 2: GERENCIAR CATEGORIAS --- */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dedbcb] flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#5d4a2f]">
                <Tag className="text-[#8f7355]"/> Categorias de Produtos
            </h2>
            <p className="text-xs text-gray-400 mb-4">Adicione categorias para organizar seus produtos e relatórios.</p>

            {/* Adicionar Nova */}
            <form onSubmit={adicionarCategoria} className="flex gap-2 mb-6">
                <input 
                    className="flex-1 border p-2 rounded text-gray-900 border-[#dedbcb] focus:border-[#8f7355] outline-none uppercase text-sm"
                    placeholder="NOVA CATEGORIA..."
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                />
                <button className="bg-[#5d4a2f] text-white px-4 rounded hover:bg-[#433522]"><Plus/></button>
            </form>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-80 pr-2">
                {categorias.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-[#f9f8f6] rounded border border-[#dedbcb]">
                        <span className="font-bold text-sm text-[#5d4a2f]">{cat.nome}</span>
                        <button onClick={() => removerCategoria(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  )
}