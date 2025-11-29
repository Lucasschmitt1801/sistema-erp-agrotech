'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DollarSign, Package, AlertTriangle, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  
  // Estados para os Cards
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [valorEstoque, setValorEstoque] = useState(0)
  const [itensBaixoEstoque, setItensBaixoEstoque] = useState(0)

  // Estados para os Gráficos
  const [dadosVendas, setDadosVendas] = useState<any[]>([])
  const [dadosEstoque, setDadosEstoque] = useState<any[]>([])

  const CORES_PIZZA = ['#0a3d91', '#e5e7eb']; // Azul e Cinza

  useEffect(() => {
    carregarDadosReais()
  }, [])

  async function carregarDadosReais() {
    setLoading(true)

    // 1. Buscar Produtos (Para card de Total e Valor Potencial)
    const { data: produtos } = await supabase.from('produtos').select('*')
    
    if (produtos) {
      setTotalProdutos(produtos.length)
      const totalValor = produtos.reduce((acc, prod) => acc + (prod.preco_venda || 0), 0)
      setValorEstoque(totalValor)
    }

    // 2. Buscar Saldo de Estoque (Para o Gráfico de Pizza e Card de Alerta)
    // Nota: Se ainda não fizemos entrada de estoque, isso virá vazio.
    const { data: saldos } = await supabase.from('estoque_saldo').select('*')
    
    let totalPecasFisicas = 0
    let baixoEstoqueCount = 0

    if (saldos) {
      saldos.forEach(item => {
        totalPecasFisicas += item.quantidade
        if (item.quantidade < 5) baixoEstoqueCount++ // Regra: Menos de 5 é baixo
      })
      setItensBaixoEstoque(baixoEstoqueCount)
    }

    // Montar dados do Gráfico de Pizza (Real vs Capacidade ou Disponível)
    setDadosEstoque([
      { name: 'Em Estoque', value: totalPecasFisicas },
      { name: 'Sem Estoque', value: (produtos?.length || 0) - totalPecasFisicas } // Apenas visualização lógica
    ])

    // 3. Buscar Vendas dos Últimos 7 dias (Para o Gráfico de Barras)
    const hoje = new Date()
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(hoje.getDate() - 7)

    const { data: vendas } = await supabase
      .from('vendas')
      .select('created_at, valor_total')
      .gte('created_at', seteDiasAtras.toISOString())

    // Processar as vendas para agrupar por dia da semana
    const vendasPorDia = processarVendasPorDia(vendas || [])
    setDadosVendas(vendasPorDia)

    setLoading(false)
  }

  // Função auxiliar para agrupar vendas por dia (Seg, Ter, Qua...)
  function processarVendasPorDia(vendas: any[]) {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const agrupado: any = {}

    // Inicializa os últimos 7 dias com zero
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const nomeDia = diasSemana[d.getDay()]
      agrupado[nomeDia] = 0 // Começa zerado
    }

    // Soma os valores reais do banco
    vendas.forEach(venda => {
      const dataVenda = new Date(venda.created_at)
      const nomeDia = diasSemana[dataVenda.getDay()]
      if (agrupado[nomeDia] !== undefined) {
        agrupado[nomeDia] += venda.valor_total
      }
    })

    // Transforma em array para o gráfico ler
    return Object.keys(agrupado).map(dia => ({
      name: dia,
      vendas: agrupado[dia]
    }))
  }

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Carregando dados reais...</div>

  return (
    <div>
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <Link href="/novo-produto" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
          <Plus size={20} />
          <span>Novo Produto</span>
        </Link>
      </header>
      
      {/* --- CARDS (DADOS REAIS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Potencial de Venda (Cadastro)</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              R$ {valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-green-500"></div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Produtos Cadastrados</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {totalProdutos} <span className="text-sm font-normal text-gray-500">modelos</span>
            </h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Package size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
        </div>

         {/* Card 3 */}
         <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Alerta Estoque Baixo</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {itensBaixoEstoque} <span className="text-sm font-normal text-gray-500">itens</span>
            </h3>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <AlertTriangle size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500"></div>
        </div>
      </div>


      {/* --- GRÁFICOS (DADOS REAIS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* GRÁFICO DE VENDAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Vendas da Semana (R$)</h2>
          <div className="flex-1 w-full min-h-0">
            {dadosVendas.every(d => d.vendas === 0) ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                Nenhuma venda registrada nos últimos 7 dias.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVendas} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip formatter={(value) => `R$ ${value}`} cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="vendas" fill="#0a3d91" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO DE ESTOQUE */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Estoque Físico</h2>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
            
            {/* Verifica se tem dados de estoque */}
            {dadosEstoque[0].value ===