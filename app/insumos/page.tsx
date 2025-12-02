'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit, AlertTriangle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function Insumos() {
  const [insumos, setInsumos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<any>(null)
  const [novo, setNovo] = useState({ nome: '', unidade: 'un', estoque_atual: '', estoque_minimo: '', custo_medio: '' })

  useEffect(() => { fetchInsumos() }, [])

  async function fetchInsumos() {
    setLoading(true)
    const { data } = await supabase.from('insumos').select('*').order('nome')
    if (data) setInsumos(data)
    setLoading(false)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    
    const dados = {
        nome: editando ? editando.nome : novo.nome,
        unidade: editando ? editando.unidade : novo.unidade,
        estoque_atual: parseFloat((editando ? editando.estoque_atual : novo.estoque_atual).toString().replace(',', '.')) || 0,
        estoque_minimo: parseFloat((editando ? editando.estoque_minimo : novo.estoque_minimo).toString().replace(',', '.')) || 0,
        custo_medio: parseFloat((editando ? editando.custo_medio : novo.custo_medio).toString().replace(',', '.')) || 0,
    }

    if (editando) {
        await supabase.from('insumos').update(dados).eq('id', editando.id)
        setEditando(null)
    } else {
        await supabase.from('insumos').insert(dados)
        setNovo({ nome: '', unidade: 'un', estoque_atual: '', estoque_minimo: '', custo_medio: '' })
    }
    fetchInsumos()
  }

  async function deletar(id: string) {
    if(confirm('Excluir este insumo?')) {
        const { error } = await supabase.from('insumos').delete().match({ id })
        if (error) alert('Não é possível excluir insumo que faz parte de uma Ficha Técnica.')
        else fetchInsumos()
    }
  }

  return (
    <div className="max-w-5xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-purple-600"/> Estoque de Insumos
        </h1>
        <Link href="/compras" className="text-purple-600 font-bold hover:underline">
            Ver Lista de Compras Sugerida →
        </Link>
      </div>

      {/* Formulário */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 mb-8">
        <h2 className="font-bold text-gray-500 mb-4 uppercase text-xs">{editando ? 'Editar Insumo' : 'Novo Insumo'}</h2>
        <form onSubmit={salvar} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-400">Nome</label>
                <input className="w-full border p-2 rounded" placeholder="Ex: Couro Preto" 
                    value={editando ? editando.nome : novo.nome} 
                    onChange={e => editando ? setEditando({...editando, nome: e.target.value}) : setNovo({...novo, nome: e.target.value})} />
            </div>
            <div className="w-24">
                <label className="text-xs font-bold text-gray-400">Unidade</label>
                <select className="w-full border p-2 rounded bg-white"
                    value={editando ? editando.unidade : novo.unidade} 
                    onChange={e => editando ? setEditando({...editando, unidade: e.target.value}) : setNovo({...novo, unidade: e.target.value})}>
                    <option value="un">Un</option>
                    <option value="m">Metros</option>
                    <option value="m2">m²</option>
                    <option value="kg">Kg</option>
                    <option value="l">Litro</option>
                </select>
            </div>
            <div className="w-24">
                <label className="text-xs font-bold text-gray-400">Estoque</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="0"
                    value={editando ? editando.estoque_atual : novo.estoque_atual} 
                    onChange={e => editando ? setEditando({...editando, estoque_atual: e.target.value}) : setNovo({...novo, estoque_atual: e.target.value})} />
            </div>
            <div className="w-24">
                <label className="text-xs font-bold text-gray-400">Mínimo</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="5"
                    value={editando ? editando.estoque_minimo : novo.estoque_minimo} 
                    onChange={e => editando ? setEditando({...editando, estoque_minimo: e.target.value}) : setNovo({...novo, estoque_minimo: e.target.value})} />
            </div>
            <div className="w-28">
                <label className="text-xs font-bold text-gray-400">Custo (R$)</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="0.00"
                    value={editando ? editando.custo_medio : novo.custo_medio} 
                    onChange={e => editando ? setEditando({...editando, custo_medio: e.target.value}) : setNovo({...novo, custo_medio: e.target.value})} />
            </div>
            <div className="flex gap-2">
                {editando && <button type="button" onClick={() => setEditando(null)} className="border p-2 rounded text-gray-500">Cancelar</button>}
                <button className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 w-10 flex justify-center"><Plus/></button>
            </div>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-purple-50 text-purple-900">
                <tr>
                    <th className="p-4">Insumo</th>
                    <th className="p-4">Estoque</th>
                    <th className="p-4 text-right">Custo Unit.</th>
                    <th className="p-4 text-center">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {insumos.map(i => (
                    <tr key={i.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium">{i.nome}</td>
                        <td className="p-4">
                            <span className={`font-bold ${i.estoque_atual <= i.estoque_minimo ? 'text-red-500 flex items-center gap-1' : 'text-gray-700'}`}>
                                {i.estoque_atual} {i.unidade}
                                {i.estoque_atual <= i.estoque_minimo && <AlertTriangle size={14}/>}
                            </span>
                        </td>
                        <td className="p-4 text-right">R$ {i.custo_medio}</td>
                        <td className="p-4 flex justify-center gap-3">
                            <button onClick={() => setEditando(i)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={18}/></button>
                            <button onClick={() => deletar(i.id)} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}