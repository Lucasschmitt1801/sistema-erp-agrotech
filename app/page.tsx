'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DollarSign, Package, AlertTriangle, Plus, Calendar, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  
  // Estados dos Cards
  const [faturamentoSemana, setFaturamentoSemana] = useState(0)
  const [pedidosPendentes, setPedidosPendentes] = useState(0)
  const [contasPagar, setContasPagar] = useState(0)

  // Estados dos Gráficos
  const [dadosSemanais, setDadosSemanais] = useState<any[]>([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<any[]>([])

  const CORES_PIZZA = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
    setLoading(true)

    // --- 1. DEFINIR A SEMANA ATUAL (Domingo a Sábado) ---
    const hoje = new Date()
    const diaSemana = hoje.getDay() // 0 = Domingo, 6 = Sábado
    const dataInicio = new Date(hoje)
    dataInicio.setDate(hoje.getDate() - diaSemana) // Volta para o último Domingo
    dataInicio.setHours(0,0,0,0)
    
    const dataFim = new Date(dataInicio)
    dataFim.setDate(dataInicio.getDate() + 6) // Vai até Sábado
    dataFim.setHours(23,59,59,999)

    // --- 2. BUSCAR VENDAS DA SEMANA ---
    const { data: vendas } = await supabase
      .from('vendas')
      .select('valor_total, created_at')
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString())

    const totalSemana = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0
    setFaturamentoSemana(totalSemana)
    setDadosSemanais(processarGraficoSemanal(vendas || []))

    // --- 3. BUSCAR PRODUTOS MAIS VENDIDOS (PIZZA) ---
    const { data: itens } = await supabase
      .from('venda_itens')
      .select('quantidade, produtos(nome)')
    
    setProdutosMaisVendidos(processarMaisVendidos(itens || []))

    // --- 4. CARDS INFORMATIVOS ---
    // Contas a Pagar (Pendentes)
    const { data: contas } = await supabase
      .from('despesas')
      .select('valor')
      .eq('tipo', 'SAIDA')
      .eq('status', 'PENDENTE')
    
    setContasPagar(contas?.reduce((acc, c) => acc + c.valor, 0) || 0)

    // Pedidos/Orçamentos em Aberto
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ORCAMENTO')
    
    setPedidosPendentes(count || 0)

    setLoading(false)
  }

  function processarGraficoSemanal(vendas: any[]) {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const mapa = [0, 0, 0, 0, 0, 0, 0] // 7 dias zerados

    vendas.forEach(v => {
      const dia = new Date(v.created_at).getDay()
      mapa[dia] += v.valor_total
    })

    return diasSemana.map((nome, index) => ({
      name: nome,
      vendas: mapa[index]
    }))
  }

  function processarMaisVendidos(itens: any[]) {
    const contagem: any = {}
    
    itens.forEach(item => {
      const nome = item.produtos?.nome || 'Desconhecido'
      contagem[nome] = (contagem[nome] || 0) + item.quantidade
    })

    // Transforma em array, ordena e pega top 5
    return Object.keys(contagem)
      .map(key => ({ name: key, value: contagem[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Semanal</h1>
          <p className="text-sm text-gray-500">Visão de Domingo a Sábado</p>
        </div>
        <Link href="/pedidos" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
          <Plus size={20} />
          <span>Novo Pedido B2B</span>
        </Link>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Vendas da Semana</p>
          <h3 className="text-2xl font-bold text-gray-800">R$ {faturamentoSemana.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Contas a Pagar (Pendente)</p>
          <h3 className="text-2xl font-bold text-red-600">R$ {contasPagar.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Orçamentos Abertos</p>
          <h3 className="text-2xl font-bold text-gray-800">{pedidosPendentes}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        {/* GRÁFICO SEMANAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 flex flex-col border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Performance da Semana</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSemanais}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip formatter={(v) => `R$ ${v}`} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="vendas" fill="#0a3d91" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO MAIS VENDIDOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Produtos</h2>
          <div className="flex-1 w-full min-h-0 relative">
            {produtosMaisVendidos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={produtosMaisVendidos} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {produtosMaisVendidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem vendas ainda.</div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">Baseado na quantidade vendida</div>
        </div>
      </div>
    </div>
  )
}