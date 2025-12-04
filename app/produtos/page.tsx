'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Search, Edit, Minus, Save, X, Filter } from 'lucide-react'

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([]) // Lista de categorias
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [dadosEdicao, setDadosEdicao] = useState<any>({})

  useEffect(() => { 
      fetchProdutos()
      fetchCategorias() 
  }, [])

  async function fetchCategorias() {
      const { data } = await supabase.from('categorias').select('*').order('nome')
      if (data) setCategorias(data)
  }

  async function fetchProdutos() {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*, estoque_saldo(quantidade, id)')
      .order('nome')
    
    const formatado = data?.map(p => ({
        ...p,
        estoque_atual: p.estoque_saldo?.[0]?.quantidade || 0,
        estoque_id: p.estoque_saldo?.[0]?.id
    }))

    if (formatado) setProdutos(formatado)
    setLoading(false)
  }

  async function ajustarEstoque(produto: any, qtd: number) {
    const novoSaldo = Math.max(0, produto.estoque_atual + qtd)
    setProdutos(prev => prev.map(p => p.id === produto.id ? {...p, estoque_atual: novoSaldo} : p))

    if (produto.estoque_id) {
        await supabase.from('estoque_saldo').update({ quantidade: novoSaldo }).eq('id', produto.estoque_id)
    } else {
        const { data: locais } = await supabase.from('locais_estoque').select('id').limit(1)
        if(locais) {
             await supabase.from('estoque_saldo').insert({ 
                 produto_id: produto.id, local_id: locais[0].id, quantidade: novoSaldo 
             })
        }
    }
  }

  async function deletarProduto(id: string) {
    if (!confirm('Tem certeza? Se o produto já teve vendas, ele não será excluído.')) return
    const { error } = await supabase.from('produtos').delete().match({ id })
    if (error) alert('Não foi possível excluir. Este produto possui histórico.')
    else fetchProdutos()
  }

  function iniciarEdicao(prod: any) {
    setEditandoId(prod.id)
    setDadosEdicao({ ...prod })
  }

  async function salvarEdicao() {
    await supabase.from('produtos').update({
        nome: dadosEdicao.nome,
        sku: dadosEdicao.sku,
        preco_custo: dadosEdicao.preco_custo,
        preco_venda: dadosEdicao.preco_venda,
        categoria: dadosEdicao.categoria // Salva a nova categoria
    }).eq('id', editandoId)
    
    setEditandoId(null)
    fetchProdutos()
  }

  const produtosFiltrados = produtos.filter(p => {
    const matchNome = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.sku?.toLowerCase().includes(busca.toLowerCase())
    const matchCat = filtroCategoria ? p.categoria === filtroCategoria : true
    return matchNome && matchCat
  })

  return (
    <div className="max-w-6xl mx-auto text-[#5d4a2f]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Gerenciar Estoque</h1>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          
          {/* Filtro de Categoria */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
            <select 
                className="pl-10 pr-4 py-2 border border-[#dedbcb] rounded-lg w-full md:w-40 text-[#5d4a2f] bg-white focus:outline-none focus:border-[#8f7355] appearance-none"
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
            >
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          {/* Busca Texto */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar nome ou SKU..." 
              className="pl-10 pr-4 py-2 border border-[#dedbcb] rounded-lg w-full text-[#5d4a2f] focus:outline-none focus:border-[#8f7355]"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <Link href="/novo-produto" className="bg-[#8f7355] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#5d4a2f] transition-colors whitespace-nowrap justify-center">
            <Plus size={20} /> <span>Novo</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#dedbcb] overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#f9f8f6] border-b border-[#dedbcb] text-[#5d4a2f]">
                <tr>
                <th className="p-4 font-bold text-sm uppercase">Produto</th>
                <th className="p-4 font-bold text-sm uppercase">Categoria</th>
                <th className="p-4 font-bold text-sm uppercase text-center">Estoque</th>
                <th className="p-4 font-bold text-sm uppercase text-right">Custo</th>
                <th className="p-4 font-bold text-sm uppercase text-right">Venda</th>
                <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {produtosFiltrados.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#f9f8f6] transition-colors">
                    {editandoId === prod.id ? (
                        /* MODO EDIÇÃO */
                        <>
                        <td className="p-4">
                            <input className="border p-1 rounded w-full mb-1 text-sm" value={dadosEdicao.nome} onChange={e => setDadosEdicao({...dadosEdicao, nome: e.target.value})} />
                            <input className="border p-1 rounded w-24 text-xs" value={dadosEdicao.sku} onChange={e => setDadosEdicao({...dadosEdicao, sku: e.target.value})} />
                        </td>
                        <td className="p-4">
                            <select 
                                className="border p-1 rounded w-full text-sm bg-white"
                                value={dadosEdicao.categoria} 
                                onChange={e => setDadosEdicao({...dadosEdicao, categoria: e.target.value})}
                            >
                                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>
                        </td>
                        <td className="p-4 text-center text-gray-400 text-xs">-</td>
                        <td className="p-4 text-right">
                            <input type="number" className="border p-1 rounded w-20 text-right text-sm" 
                                value={dadosEdicao.preco_custo} onChange={e => setDadosEdicao({...dadosEdicao, preco_custo: e.target.value})} />
                        </td>
                        <td className="p-4 text-right">
                            <input type="number" className="border p-1 rounded w-20 text-right text-sm" 
                                value={dadosEdicao.preco_venda} onChange={e => setDadosEdicao({...dadosEdicao, preco_venda: e.target.value})} />
                        </td>
                        <td className="p-4 text-center flex gap-2 justify-center">
                            <button onClick={salvarEdicao} className="text-green-600 bg-green-50 p-2 rounded hover:bg-green-100"><Save size={18}/></button>
                            <button onClick={() => setEditandoId(null)} className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><X size={18}/></button>
                        </td>
                        </>
                    ) : (
                        /* MODO LEITURA */
                        <>
                        <td className="p-4">
                            <div className="font-bold text-[#5d4a2f]">{prod.nome}</div>
                            <div className="text-xs text-gray-400 font-mono">{prod.sku}</div>
                        </td>
                        <td className="p-4">
                            <span className="text-xs bg-[#dedbcb] text-[#5d4a2f] px-2 py-1 rounded font-bold">{prod.categoria || 'Geral'}</span>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => ajustarEstoque(prod, -1)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded p-1"><Minus size={14}/></button>
                                <span className={`font-bold text-lg w-8 text-center ${prod.estoque_atual < 5 ? 'text-red-500' : 'text-[#5d4a2f]'}`}>
                                    {prod.estoque_atual}
                                </span>
                                <button onClick={() => ajustarEstoque(prod, 1)} className="text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded p-1"><Plus size={14}/></button>
                            </div>
                        </td>
                        <td className="p-4 text-right text-gray-500 text-sm">
                            R$ {prod.preco_custo}
                        </td>
                        <td className="p-4 text-right font-bold text-[#8f7355]">R$ {prod.preco_venda}</td>
                        <td className="p-4 text-center flex gap-2 justify-center">
                            <button onClick={() => iniciarEdicao(prod)} className="text-blue-500 hover:bg-blue-50 p-2 rounded transition"><Edit size={18}/></button>
                            <button onClick={() => deletarProduto(prod.id)} className="text-gray-300 hover:text-red-500 p-2 rounded transition"><Trash2 size={18}/></button>
                        </td>
                        </>
                    )}
                </tr>
                ))}
                {produtosFiltrados.length === 0 && !loading && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">Nenhum produto encontrado com estes filtros.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}