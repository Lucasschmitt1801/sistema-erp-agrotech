'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Calendar, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('SAIDA') // 'SAIDA' ou 'ENTRADA'
  
  // Novo Lançamento
  const [novo, setNovo] = useState({ 
      descricao: '', valor: '', vencimento: '', status: 'PENDENTE', tipo: 'SAIDA' 
  })

  useEffect(() => { fetchTransacoes() }, [tipoFiltro])

  async function fetchTransacoes() {
    setLoading(true)
    const { data } = await supabase
        .from('despesas')
        .select('*')
        .eq('tipo', tipoFiltro)
        .order('vencimento', { ascending: true })
    
    if (data) setTransacoes(data)
    setLoading(false)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!novo.descricao || !novo.valor) return

    const valorFloat = parseFloat(novo.valor.replace(',', '.'))

    await supabase.from('despesas').insert([{
      descricao: novo.descricao,
      valor: valorFloat,
      vencimento: novo.vencimento || new Date(),
      status: novo.status,
      tipo: tipoFiltro
    }])

    setNovo({ descricao: '', valor: '', vencimento: '', status: 'PENDENTE', tipo: tipoFiltro })
    fetchTransacoes()
  }

  async function alternarStatus(item: any) {
    const novoStatus = item.status === 'PAGO' ? 'PENDENTE' : 'PAGO'
    await supabase.from('despesas').update({ status: novoStatus }).eq('id', item.id)
    fetchTransacoes()
  }

  async function deletar(id: string) {
    if(confirm('Excluir lançamento?')) {
      await supabase.from('despesas').delete().match({ id })
      fetchTransacoes()
    }
  }

  return (
    <div className="max-w-4xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Controle Financeiro</h1>

      {/* ABAS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
            onClick={() => setTipoFiltro('SAIDA')}
            className={`pb-2 px-4 flex items-center gap-2 font-bold ${tipoFiltro === 'SAIDA' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400'}`}
        >
            <ArrowDownCircle size={20}/> Contas a Pagar
        </button>
        <button 
            onClick={() => setTipoFiltro('ENTRADA')}
            className={`pb-2 px-4 flex items-center gap-2 font-bold ${tipoFiltro === 'ENTRADA' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}
        >
            <ArrowUpCircle size={20}/> Valores a Receber
        </button>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-4">
            Novo Lançamento ({tipoFiltro === 'SAIDA' ? 'Despesa' : 'Receita'})
        </h2>
        <form onSubmit={salvar} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Descrição</label>
            <input className="w-full p-2 border rounded text-gray-900" 
              value={novo.descricao} onChange={e => setNovo({...novo, descricao: e.target.value})} placeholder="Ex: Aluguel" />
          </div>
          <div className="w-full md:w-32">
             <label className="text-xs font-bold text-gray-500 mb-1 block">Valor (R$)</label>
             <input type="number" step="0.01" className="w-full p-2 border rounded text-gray-900" 
              value={novo.valor} onChange={e => setNovo({...novo, valor: e.target.value})} placeholder="0,00" />
          </div>
          <div className="w-full md:w-40">
             <label className="text-xs font-bold text-gray-500 mb-1 block">Vencimento</label>
             <input type="date" className="w-full p-2 border rounded text-gray-900" 
              value={novo.vencimento} onChange={e => setNovo({...novo, vencimento: e.target.value})} />
          </div>
          <div className="w-full md:w-32">
             <label className="text-xs font-bold text-gray-500 mb-1 block">Status</label>
             <select className="w-full p-2 border rounded text-gray-900" value={novo.status} onChange={e => setNovo({...novo, status: e.target.value})}>
                 <option value="PENDENTE">Pendente</option>
                 <option value="PAGO">Pago</option>
             </select>
          </div>
          <button className={`p-2 rounded w-full md:w-auto text-white font-bold ${tipoFiltro === 'SAIDA' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
            <Plus size={24} />
          </button>
        </form>
      </div>

      {/* LISTAGEM */}
      <div className="space-y-3">
        {transacoes.map(item => (
          <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center ${item.status === 'PAGO' ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4">
              <button onClick={() => alternarStatus(item)} title="Clique para alterar status">
                  {item.status === 'PAGO' 
                    ? <CheckCircle className="text-green-500" size={24}/> 
                    : <XCircle className="text-gray-300 hover:text-green-500" size={24}/> 
                  }
              </button>
              <div>
                <p className={`font-bold ${item.status === 'PAGO' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.descricao}</p>
                <p className="text-xs text-gray-500">
                    Vence em: {item.vencimento ? new Date(item.vencimento).toLocaleDateString() : 'Sem data'} • {item.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-bold ${tipoFiltro === 'SAIDA' ? 'text-red-600' : 'text-green-600'}`}>
                {tipoFiltro === 'SAIDA' ? '-' : '+'} R$ {item.valor.toFixed(2)}
              </span>
              <button onClick={() => deletar(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}