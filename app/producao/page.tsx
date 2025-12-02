'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, ArrowRight, Layers, Save } from 'lucide-react'

export default function FichaTecnica() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [insumos, setInsumos] = useState<any[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('')
  const [ficha, setFicha] = useState<any[]>([])
  
  // Novo item na ficha
  const [itemNovo, setItemNovo] = useState({ insumo_id: '', quantidade: '' })

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if(produtoSelecionado) carregarFicha(produtoSelecionado)
  }, [produtoSelecionado])

  async function carregarDados() {
    const { data: prods } = await supabase.from('produtos').select('id, nome').order('nome')
    const { data: ins } = await supabase.from('insumos').select('*').order('nome')
    if(prods) setProdutos(prods)
    if(ins) setInsumos(ins)
  }

  async function carregarFicha(idProd: string) {
    const { data } = await supabase.from('ficha_tecnica')
        .select('*, insumos(nome, unidade, custo_medio)')
        .eq('produto_id', idProd)
    if(data) setFicha(data)
  }

  async function adicionarItem(e: React.FormEvent) {
    e.preventDefault()
    if(!produtoSelecionado || !itemNovo.insumo_id || !itemNovo.quantidade) return

    await supabase.from('ficha_tecnica').insert({
        produto_id: produtoSelecionado,
        insumo_id: itemNovo.insumo_id,
        quantidade_necessaria: parseFloat(itemNovo.quantidade.replace(',', '.'))
    })
    
    setItemNovo({ insumo_id: '', quantidade: '' })
    carregarFicha(produtoSelecionado)
  }

  async function removerItem(id: string) {
    await supabase.from('ficha_tecnica').delete().eq('id', id)
    carregarFicha(produtoSelecionado)
  }

  // Cálculo do Custo Total de Matéria Prima
  const custoTotal = ficha.reduce((acc, item) => acc + (item.quantidade_necessaria * (item.insumos?.custo_medio || 0)), 0)

  return (
    <div className="max-w-6xl mx-auto text-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* Lado Esquerdo: Seleção de Produto */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-1 flex flex-col">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Layers className="text-blue-600"/> 1. Selecione o Produto</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
            {produtos.map(p => (
                <button key={p.id} 
                    onClick={() => setProdutoSelecionado(p.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${produtoSelecionado === p.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
                >
                    {p.nome}
                </button>
            ))}
        </div>
      </div>

      {/* Lado Direito: A Receita */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2 flex flex-col">
        {produtoSelecionado ? (
            <>
                <div className="flex justify-between items-end border-b pb-4 mb-4">
                    <div>
                        <h2 className="font-bold text-xl">Ficha Técnica</h2>
                        <p className="text-sm text-gray-500">Lista de materiais para produzir 1 unidade</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Custo Estimado (Matéria-Prima)</p>
                        <p className="text-2xl font-bold text-green-600">R$ {custoTotal.toFixed(2)}</p>
                    </div>
                </div>

                {/* Adicionar Insumo */}
                <form onSubmit={adicionarItem} className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <select className="flex-1 border p-2 rounded bg-white text-sm" 
                        value={itemNovo.insumo_id} onChange={e => setItemNovo({...itemNovo, insumo_id: e.target.value})}>
                        <option value="">+ Adicionar Insumo à receita...</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                    </select>
                    <input type="number" step="0.0001" className="w-24 border p-2 rounded bg-white text-sm" placeholder="Qtd"
                        value={itemNovo.quantidade} onChange={e => setItemNovo({...itemNovo, quantidade: e.target.value})} />
                    <button className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 font-bold text-sm">Adicionar</button>
                </form>

                {/* Lista de Itens */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Insumo</th>
                                <th className="p-3 text-center">Qtd Necessária</th>
                                <th className="p-3 text-right">Custo Aprox.</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {ficha.map(item => (
                                <tr key={item.id}>
                                    <td className="p-3 font-medium">{item.insumos?.nome}</td>
                                    <td className="p-3 text-center font-bold">{item.quantidade_necessaria} {item.insumos?.unidade}</td>
                                    <td className="p-3 text-right text-gray-500">R$ {(item.quantidade_necessaria * item.insumos?.custo_medio).toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => removerItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ficha.length === 0 && <p className="text-center text-gray-400 mt-10">Nenhum insumo cadastrado para este produto ainda.</p>}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <ArrowRight size={48} className="mb-4 opacity-20"/>
                <p>Selecione um produto ao lado para ver ou editar sua ficha técnica.</p>
            </div>
        )}
      </div>
    </div>
  )
}