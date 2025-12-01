'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react'

export default function Financeiro() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novoGasto, setNovoGasto] = useState({ descricao: '', valor: '', categoria: 'Geral' })

  useEffect(() => {
    fetchDespesas()
  }, [])

  async function fetchDespesas() {
    setLoading(true)
    const { data } = await supabase.from('despesas').select('*').order('data_despesa', { ascending: false })
    if (data) setDespesas(data)
    setLoading(false)
  }

  async function salvarDespesa(e: React.FormEvent) {
    e.preventDefault()
    if (!novoGasto.descricao || !novoGasto.valor) return

    const valorFloat = parseFloat(novoGasto.valor.replace(',', '.'))

    const { error } = await supabase.from('despesas').insert([{
      descricao: novoGasto.descricao,
      valor: valorFloat,
      categoria: novoGasto.categoria,
      data_despesa: new Date().toISOString()
    }])

    if (!error) {
      setNovoGasto({ descricao: '', valor: '', categoria: 'Geral' })
      fetchDespesas() // Recarrega a lista
    } else {
      alert('Erro ao salvar')
    }
  }

  async function deletar(id: string) {
    if(confirm('Excluir despesa?')) {
      await supabase.from('despesas').delete().match({ id })
      fetchDespesas()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Controle de Despesas</h1>

      {/* Formulário de Adição Rápida */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Novo Gasto</h2>
        <form onSubmit={salvarDespesa} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <input 
              placeholder="Ex: Gasolina, Almoço..." 
              className="w-full p-2 border rounded-lg"
              value={novoGasto.descricao}
              onChange={e => setNovoGasto({...novoGasto, descricao: e.target.value})}
            />
          </div>
          <div className="w-full md:w-32">
             <label className="text-xs text-gray-400 mb-1 block">Valor (R$)</label>
             <input 
              type="number" step="0.01" 
              placeholder="0,00" 
              className="w-full p-2 border rounded-lg"
              value={novoGasto.valor}
              onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={novoGasto.categoria}
              onChange={e => setNovoGasto({...novoGasto, categoria: e.target.value})}
            >
              <option>Geral</option>
              <option>Transporte</option>
              <option>Alimentação</option>
              <option>Marketing</option>
              <option>Estrutura/Estande</option>
            </select>
          </div>
          <button type="submit" className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg w-full md:w-auto flex justify-center items-center gap-2">
            <Plus size={20} /> <span className="md:hidden">Adicionar</span>
          </button>
        </form>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {despesas.map(item => (
          <div key={item.id} className="flex justify-between items-center p-4 border-b hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-2 rounded-full text-red-500"><DollarSign size={20}/></div>
              <div>
                <p className="font-semibold text-gray-800">{item.descricao}</p>
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()} • {item.categoria}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-red-600">- R$ {item.valor.toFixed(2)}</span>
              <button onClick={() => deletar(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
        {despesas.length === 0 && !loading && (
          <p className="p-8 text-center text-gray-400">Nenhuma despesa lançada.</p>
        )}
      </div>
    </div>
  )
}