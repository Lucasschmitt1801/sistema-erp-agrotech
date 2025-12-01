'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DollarSign, Package, AlertTriangle, Plus, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  
  // Filtro de Data
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)) // Formato YYYY-MM

  // Estados
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [lucroMes, setLucroMes] = useState(0)
  const [itensBaixoEstoque, setItensBaixoEstoque] = useState(0)
  const [dadosVendas, setDadosVendas] = useState<any[]>([])
  const [dadosEstoque, setDadosEstoque] = useState<any[]>([{ name: 'Carregando', value: 1 }])

  const CORES_PIZZA = ['#0a3d91', '#e5e7eb'];

  useEffect(() => {
    carregarDados()
  }, [mesAno]) // Recarrega sempre que muda o mês

  async function carregarDados() {
    setLoading(true)

    // Definir inicio e fim do mês selecionado
    const [ano, mes] = mesAno.split('-')
    const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1).toISOString()
    const dataFim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59).toISOString()

    // 1. Estoque e Produtos (Isso é atemporal, mostra o hoje)
    const { data: produtos } = await supabase.from('produtos').select('*')
    setTotalProdutos(produtos?.length || 0)

    const { data: saldos } = await supabase.from('estoque_saldo').select('*')
    let totalPecas = 0
    let baixo = 0
    saldos?.forEach(item => {
      totalPecas += item.quantidade
      if (item.quantidade < 5) baixo++
    })
    setItensBaixoEstoque(baixo)
    setDadosEstoque([
      { name: 'Em Estoque', value: totalPecas },
      { name: 'Sem Estoque', value: Math.max(0, (produtos?.length || 0) * 10 - totalPecas) } // Estimativa visual
    ])

    // 2. Vendas do Mês Selecionado
    const { data: vendas } = await supabase
      .from('vendas')
      .select('valor_total, created_at, venda_itens(quantidade, produtos(preco_custo))')
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim)

    let totalFat = 0
    let custoTotal = 0

    // Processamento financeiro
    vendas?.forEach((venda: any) => {
      totalFat += venda.valor_total
      // Calcular custo (aprosimado)
      venda.venda_itens?.forEach((item: any) => {
        custoTotal += (item.quantidade * (item.produtos?.preco_custo || 0))
      })
    })

    // 3. Despesas do Mês
    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor')
      .gte('data_despesa', dataInicio)
      .lte('data_despesa', dataFim)
    
    const totalDespesas = despesas?.reduce((acc, d) => acc + d.valor, 0) || 0

    setFaturamentoMes(totalFat)
    setLucroMes(totalFat - custoTotal - totalDespesas)
    
    // Gráfico de vendas (agrupado por dia do mês)
    setDadosVendas(processarGraficoVendas(vendas || []))
    setLoading(false)
  }

  function processarGraficoVendas(vendas: any[]) {
    const dias = []
    // Pega apenas os dias que tiveram venda para não ficar gigante
    const agrupado: any = {}
    
    vendas.forEach(v => {
      const dia = new Date(v.created_at).getDate()
      agrupado[dia] = (agrupado[dia] || 0) + v.valor_total
    })

    return Object.keys(agrupado).map(dia => ({
      name: `Dia ${dia}`,
      vendas: agrupado[dia]
    }))
  }

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel de Controle</h1>
          <p className="text-sm text-gray-500">Haras do Sul</p>
        </div>

        {/* SELETOR DE MÊS */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow border border-gray-200">
          <Calendar size={20} className="text-gray-500"/>
          <input 
            type="month" 
            className="outline-none text-gray-700 font-bold bg-transparent"
            value={mesAno}
            onChange={e => setMesAno(e.target.value)}
          />
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Faturamento ({mesAno})</p>
          <h3 className="text-2xl font-bold text-gray-800">R$ {faturamentoMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Resultado Líquido ({mesAno})</p>
          <h3 className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
            R$ {lucroMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </h3>
          <p className="text-xs text-gray-400">Vendas - Custos - Despesas</p>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Alertas de Estoque</p>
          <h3 className="text-2xl font-bold text-gray-800">{itensBaixoEstoque} <span className="text-sm font-normal">itens baixos</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 flex flex-col border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Performance Diária</h2>
          <div className="flex-1 w-full min-h-0">
            {dadosVendas.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem vendas neste mês.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12}/>
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} fontSize={12}/>
                  <Tooltip formatter={(v) => `R$ ${v}`} cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="vendas" fill="#0a3d91" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Saúde do Estoque</h2>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosEstoque} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {dadosEstoque.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl font-bold text-gray-700">{itensBaixoEstoque}</span>
                <p className="text-[10px] uppercase text-gray-400">Críticos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}