'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Search, Edit, Minus, Save, X } from 'lucide-react'

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  
  // Estado para Edição
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [dadosEdicao, setDadosEdicao] = useState<any>({})

  useEffect(() => { fetchProdutos() }, [])

  async function fetchProdutos() {
    setLoading(true)
    // Busca produtos + saldo do estoque (join)
    const { data } = await supabase
      .from('produtos')
      .select('*, estoque_saldo(quantidade, id)')
      .order('nome')
    
    // Formatar para facilitar leitura
    const formatado = data?.map(p => ({
        ...p,
        estoque_atual: p.estoque_saldo?.[0]?.quantidade || 0,
        estoque_id: p.estoque_saldo?.[0]?.id
    }))

    if (formatado) setProdutos(formatado)
    setLoading(false)
  }

  // --- FUNÇÕES DE ESTOQUE ---
  async function ajustarEstoque(produto: any, qtd: number) {
    const novoSaldo = Math.max(0, produto.estoque_atual + qtd)
    
    // Atualiza visualmente na hora (pra ficar rapido)
    setProdutos(prev => prev.map(p => p.id === produto.id ? {...p, estoque_atual: novoSaldo} : p))

    // Salva no banco
    if (produto.estoque_id) {
        await supabase.from('estoque_saldo').update({ quantidade: novoSaldo }).eq('id', produto.estoque_id)
    } else {
        // Se não existir saldo criado ainda, cria agora
        const { data: locais } = await supabase.from('locais_estoque').select('id').limit(1)
        if(locais) {
             await supabase.from('estoque_saldo').insert({ 
                 produto_id: produto.id, 
                 local_id: locais[0].id, 
                 quantidade: novoSaldo 
             })
        }
    }
  }

  // --- FUNÇÕES DE EXCLUSÃO ---
  async function deletarProduto(id: string) {
    if (!confirm('Tem certeza? Se o produto já teve vendas, ele não será excluído para manter o histórico.')) return

    const { error } = await supabase.from('produtos').delete().match({ id })
    
    if (error) {
        // O erro mais comum é violação de Foreign Key (já tem venda)
        alert('Não foi possível excluir. Provavelmente este produto já possui vendas registradas.\n\nDica: Edite o nome dele para "INATIVO" se quiser escondê-lo.')
    } else {
        fetchProdutos()
    }
  }

  // --- FUNÇÕES DE EDIÇÃO ---
  function iniciarEdicao(prod: any) {
    setEditandoId(prod.id)
    setDadosEdicao({ ...prod })
  }

  async function salvarEdicao() {
    await supabase.from('produtos').update({
        nome: dadosEdicao.nome,
        sku: dadosEdicao.sku,
        preco_custo: dadosEdicao.preco_custo,
        preco_venda: dadosEdicao.preco_venda
    }).eq('id', editandoId)
    
    setEditandoId(null)
    fetchProdutos()
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.sku?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Gerenciar Estoque</h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-full text-gray-900"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <Link href="/novo-produto" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap">
            <Plus size={20} /> <span>Novo</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-gray-600">Produto</th>
              <th className="p-4 text-gray-600 text-center">Estoque</th>
              <th className="p-4 text-gray-600 text-right">Custo</th>
              <th className="p-4 text-gray-600 text-right">Venda</th>
              <th className="p-4 text-gray-600 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtosFiltrados.map((prod) => (
               <tr key={prod.id} className="hover:bg-gray-50">
                  {editandoId === prod.id ? (
                    /* MODO EDIÇÃO */
                    <>
                      <td className="p-4">
                        <input className="border p-1 rounded w-full mb-1" value={dadosEdicao.nome} onChange={e => setDadosEdicao({...dadosEdicao, nome: e.target.value})} />
                        <input className="border p-1 rounded w-32 text-xs" value={dadosEdicao.sku} onChange={e => setDadosEdicao({...dadosEdicao, sku: e.target.value})} />
                      </td>
                      <td className="p-4 text-center text-gray-400">Edite estoque fora</td>
                      <td className="p-4 text-right">
                        <input type="number" className="border p-1 rounded w-20 text-right" value={dadosEdicao.preco_custo} onChange={e => setDadosEdicao({...dadosEdicao, preco_custo: e.target.value})} />
                      </td>
                      <td className="p-4 text-right">
                        <input type="number" className="border p-1 rounded w-20 text-right" value={dadosEdicao.preco_venda} onChange={e => setDadosEdicao({...dadosEdicao, preco_venda: e.target.value})} />
                      </td>
                      <td className="p-4 text-center flex gap-2 justify-center">
                        <button onClick={salvarEdicao} className="text-green-600 bg-green-100 p-2 rounded"><Save size={18}/></button>
                        <button onClick={() => setEditandoId(null)} className="text-red-600 bg-red-100 p-2 rounded"><X size={18}/></button>
                      </td>
                    </>
                  ) : (
                    /* MODO LEITURA */
                    <>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{prod.nome}</div>
                        <div className="text-xs text-gray-500 bg-gray-100 inline px-1 rounded">{prod.sku}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => ajustarEstoque(prod, -1)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-1"><Minus size={16}/></button>
                            <span className={`font-bold text-lg w-8 text-center ${prod.estoque_atual < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                                {prod.estoque_atual}
                            </span>
                            <button onClick={() => ajustarEstoque(prod, 1)} className="text-gray-400 hover:text-green-500 hover:bg-green-50 rounded p-1"><Plus size={16}/></button>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-500">R$ {prod.preco_custo}</td>
                      <td className="p-4 text-right font-bold text-green-600">R$ {prod.preco_venda}</td>
                      <td className="p-4 text-center flex gap-2 justify-center">
                        <button onClick={() => iniciarEdicao(prod)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit size={18}/></button>
                        <button onClick={() => deletarProduto(prod.id)} className="text-gray-300 hover:text-red-500 p-2 rounded"><Trash2 size={18}/></button>
                      </td>
                    </>
                  )}
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}