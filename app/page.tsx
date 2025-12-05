'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, 
  ArrowRight, ShoppingBag, Truck, Calendar 
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  // KPIs
  const [kpis, setKpis] = useState({
    faturamento: 0,
    despesas: 0,
    lucro: 0,
    pedidosAbertos: 0,
    ticketMedio: 0
  })

  // Listas e Gráficos
  const [graficoFinanceiro, setGraficoFinanceiro] = useState<any[]>([])
  const [estoqueBaixo, setEstoqueBaixo] = useState<any[]>([])
  const [ultimasVendas, setUltimasVendas] = useState<any[]>([])

  useEffect(() => {
    carregarDashboard()
  }, [mesAno])

  async function carregarDashboard() {
    setLoading(true)
    const [ano, mes] = mesAno.split('-')
    const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1).toISOString()
    const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59).toISOString()

    // 1. Vendas do Mês
    const { data: vendas } = await supabase
      .from('vendas')
      .select('valor_total, created_at')
      .gte('created_at', inicio).lte('created_at', fim)
      .order('created_at', { ascending: true })

    const totalVendas = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0
    const qtdVendas = vendas?.length || 1

    // 2. Despesas do Mês (Pagamento Realizado)
    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor, vencimento')
      .gte('vencimento', inicio).lte('vencimento', fim)
      .eq('tipo', 'SAIDA') // Apenas saídas
      .eq('status', 'PAGO') // Apenas o que saiu do caixa de verdade

    const totalDespesas = despesas?.reduce((acc, d) => acc + d.valor, 0) || 0

    // 3. Pedidos B2B em Aberto (Geral, não só do mês)
    const { count: pedidosCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'FATURADO')
      .neq('status', 'CANCELADO')

    // 4. Estoque Baixo (Produtos)
    const { data: produtosBaixos } = await supabase
      .from('produtos')
      .select('nome, estoque_saldo(quantidade)')
      .limit(5)
    
    // Filtrar no front pois o join do supabase é chato pra filtro
    const listaBaixa = produtosBaixos
        ?.map(p => ({ nome: p.nome, qtd: p.estoque_saldo?.[0]?.quantidade || 0 }))
        .filter(p => p.qtd < 5) || []

    setEstoqueBaixo(listaBaixa)

    // 5. Últimas 5 Vendas
    const { data: ultimas } = await supabase
      .from('vendas')
      .select('id, valor_total, created_at, cliente_nome, forma_pagamento')
      .order('created_at', { ascending: false })
      .limit(5)
    
    setUltimasVendas(ultimas || [])

    // 6. Montar Gráfico Financeiro (Agrupado por dia)
    const diasGrafico: any = {}
    vendas?.forEach(v => {
        const dia = new Date(v.created_at).getDate()
        if(!diasGrafico[dia]) diasGrafico[dia] = { dia, entradas: 0, saidas: 0 }
        diasGrafico[dia].entradas += v.valor_total
    })
    despesas?.forEach(d => {
        const dia = new Date(d.vencimento).getDate()
        if(!diasGrafico[dia]) diasGrafico[dia] = { dia, entradas: 0, saidas: 0 }
        diasGrafico[dia].saidas += d.valor
    })
    
    // Converter para array e ordenar
    const dadosGrafico = Object.values(diasGrafico).sort((a:any, b:any) => a.dia - b.dia)
    setGraficoFinanceiro(dadosGrafico)

    // Setar KPIs
    setKpis({
        faturamento: totalVendas,
        despesas: totalDespesas,
        lucro: totalVendas - totalDespesas,
        pedidosAbertos: pedidosCount || 0,
        ticketMedio: totalVendas / qtdVendas
    })

    setLoading(false)
  }

  return (
    <div className="text-[#5d4a2f]">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <p className="text-sm text-gray-500">Visão estratégica do negócio</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-[#dedbcb]">
          <Calendar size={20} className="text-[#8f7355]"/>
          <input 
            type="month" 
            className="outline-none text-[#5d4a2f] font-bold bg-transparent cursor-pointer"
            value={mesAno}
            onChange={e => setMesAno(e.target.value)}
          />
        </div>
      </header>
      
      {/* CARDS KPI (Resumo Financeiro) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Faturamento */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-gray-400 uppercase">Receita (Vendas)</p>
                <div className="bg-green-100 p-1.5 rounded text-green-600"><TrendingUp size={18}/></div>
            </div>
            <h3 className="text-2xl font-bold">R$ {kpis.faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>

        {/* Despesas */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-gray-400 uppercase">Despesas Pagas</p>
                <div className="bg-red-100 p-1.5 rounded text-red-600"><TrendingDown size={18}/></div>
            </div>
            <h3 className="text-2xl font-bold text-red-600">R$ {kpis.despesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>

        {/* Lucro Operacional */}
        <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 flex flex-col justify-between h-28 ${kpis.lucro >= 0 ? 'border-[#5d4a2f]' : 'border-orange-500'}`}>
            <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-gray-400 uppercase">Lucro Operacional</p>
                <div className="bg-[#f5f5f0] p-1.5 rounded text-[#5d4a2f]"><DollarSign size={18}/></div>
            </div>
            <h3 className={`text-2xl font-bold ${kpis.lucro >= 0 ? 'text-[#5d4a2f]' : 'text-orange-600'}`}>
                R$ {kpis.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </h3>
        </div>

        {/* Pedidos Pendentes */}
        <div className="bg-[#5d4a2f] p-5 rounded-xl shadow-lg text-[#dedbcb] flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
                <p className="text-xs font-bold opacity-80 uppercase">Pedidos em Aberto</p>
                <ShoppingBag size={18} className="text-white"/>
            </div>
            <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-white">{kpis.pedidosAbertos}</h3>
                <span className="text-xs mb-1 opacity-70">na fila</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- GRÁFICO FINANCEIRO --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            Fluxo de Caixa Diário
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">Entradas vs Saídas</span>
          </h2>
          <div className="h-80 w-full">
            {graficoFinanceiro.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">Sem movimentação neste período.</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficoFinanceiro}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: '#f9fafb'}}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Legend />
                    <Bar name="Receitas" dataKey="entradas" fill="#8f7355" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar name="Despesas" dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- COLUNA LATERAL (ALERTAS E ATIVIDADE) --- */}
        <div className="space-y-6">
            
            {/* Alerta de Estoque */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb]">
                <h2 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500"/> Atenção no Estoque
                </h2>
                {estoqueBaixo.length === 0 ? (
                    <div className="text-center py-4 text-green-600 text-sm font-medium bg-green-50 rounded-lg">
                        Estoque Saudável ✅
                    </div>
                ) : (
                    <div className="space-y-3">
                        {estoqueBaixo.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                <span className="font-medium text-gray-700">{item.nome}</span>
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-xs">{item.qtd} un</span>
                            </div>
                        ))}
                        <Link href="/insumos" className="block text-center text-xs text-blue-600 hover:underline mt-2">
                            Ver lista de compras →
                        </Link>
                    </div>
                )}
            </div>

            {/* Últimas Vendas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#dedbcb] flex-1">
                <h2 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                    <Truck size={16}/> Últimas Vendas
                </h2>
                <div className="space-y-4">
                    {ultimasVendas.map((v) => (
                        <div key={v.id} className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-[#5d4a2f]">{v.cliente_nome || 'Consumidor Final'}</p>
                                <p className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleDateString()} • {v.forma_pagamento}</p>
                            </div>
                            <span className="font-bold text-green-600 text-sm">+ R$ {v.valor_total.toFixed(0)}</span>
                        </div>
                    ))}
                    {ultimasVendas.length === 0 && <p className="text-gray-400 text-xs">Nenhuma venda recente.</p>}
                </div>
                <Link href="/vendas/historico" className="block w-full text-center bg-[#f5f5f0] text-[#8f7355] text-xs font-bold py-2 rounded mt-4 hover:bg-[#dedbcb] transition">
                    Ver Histórico Completo
                </Link>
            </div>

        </div>
      </div>
    </div>
  )
}
