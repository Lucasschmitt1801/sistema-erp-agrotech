'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DollarSign, Package, AlertTriangle, Plus } from 'lucide-react'
// Importando os gráficos da biblioteca Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [valorEstoque, setValorEstoque] = useState(0)
  const [loading, setLoading] = useState(true)

  // --- DADOS FICTÍCIOS PARA OS GRÁFICOS (Visualização) ---
  const dadosVendasSemanal = [
    { name: 'Seg', vendas: 780 },
    { name: 'Ter', vendas: 50 },
    { name: 'Qua', vendas: 250 },
    { name: 'Qui', vendas: 20 },
    { name: 'Sex', vendas: 450 },
    { name: 'Sáb', vendas: 100 },
  ];

  // Dados para o gráfico de pizza (Ex: Categorias ou Status)
  const dadosEstoquePizza = [
    { name: 'Em Estoque', value: totalProdutos },
    { name: 'Estoque Baixo', value: 2 }, // Exemplo fixo
  ];
  const CORES_PIZZA = ['#00C49F', '#FF8042']; // Verde e Laranja
  // -------------------------------------------------------


  useEffect(() => {
    async function fetchResumo() {
      setLoading(true)
      // Busca apenas o resumo para os cards do topo
      const { data, error } = await supabase
        .from('produtos')
        .select('preco_custo, preco_venda')
      
      if (data) {
        setTotalProdutos(data.length)
        // Calcula o valor total que eles podem faturar com o estoque atual
        const totalValor = data.reduce((acc, prod) => acc + (prod.preco_venda || 0), 0)
        setValorEstoque(totalValor)
      }
      setLoading(false)
    }
    fetchResumo()
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Carregando painel...</div>

  return (
    <div>
      {/* Cabeçalho da Página */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <Link href="/novo-produto" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={20} />
          <span>Novo Produto</span>
        </Link>
      </header>
      
      {/* --- CARDS DO TOPO --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Valor em Estoque (Potencial de Venda) */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Valor em Estoque (Venda)</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              R$ {valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-green-500"></div>
        </div>

        {/* Card 2: Total de Peças */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Peças em Estoque</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {totalProdutos} <span className="text-sm font-normal text-gray-500">unidades</span>
            </h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Package size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
        </div>

         {/* Card 3: Pendentes/Alertas (Exemplo Fixo) */}
         <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Estoque Baixo</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              2 <span className="text-sm font-normal text-gray-500">itens</span>
            </h3>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <AlertTriangle size={24} />
          </div>
          <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500"></div>
        </div>

      </div>


      {/* --- ÁREA DOS GRÁFICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* GRÁFICO DE BARRAS (Vendas Semanal) - Ocupa 2 colunas */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Vendas da Semana (R$) - Simulacão</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosVendasSemanal} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} prefix="R$ " />
                <Tooltip formatter={(value) => `R$ ${value}`} cursor={{fill: '#f3f4f6'}} wrapperStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="vendas" fill="#0a3d91" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE PIZZA (Status Estoque) - Ocupa 1 coluna */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Status do Estoque</h2>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
             {/* Gráfico Donut */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosEstoquePizza}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Faz o buraco no meio (Donut)
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dadosEstoquePizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Texto no meio do Donut */}
             <div className="absolute text-center">
                <p className="text-3xl font-bold text-gray-800">{totalProdutos}</p>
                <p className="text-xs text-gray-500 uppercase">Total Peças</p>
            </div>
          </div>
           {/* Legenda do Gráfico */}
          <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00C49F]"></div> Em dia</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF8042]"></div> Baixo</div>
          </div>
        </div>

      </div>
    </div>
  )
}