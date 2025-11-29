'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Search, Edit } from 'lucide-react'

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })
    
    if (data) setProdutos(data)
    setLoading(false)
  }

  async function deletarProduto(id: string) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await supabase.from('produtos').delete().match({ id })
      fetchProdutos() // Recarrega a lista
    }
  }

  // Filtro de busca simples
  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.sku?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Estoque</h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Barra de Busca */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-blue-500"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <Link href="/novo-produto" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap">
            <Plus size={20} />
            <span>Novo</span>
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Produto</th>
              <th className="p-4 font-semibold text-gray-600">SKU</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Custo</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Venda</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando estoque...</td></tr>
            ) : produtosFiltrados.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
            ) : (
              produtosFiltrados.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{prod.nome}</td>
                  <td className="p-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{prod.sku || '-'}</span>
                  </td>
                  <td className="p-4 text-right text-gray-500">R$ {prod.preco_custo}</td>
                  <td className="p-4 text-right font-bold text-green-600">R$ {prod.preco_venda}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => deletarProduto(prod.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition" 
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}