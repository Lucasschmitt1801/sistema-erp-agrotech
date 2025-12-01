'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DRE() {
  const [dados, setDados] = useState({ receita: 0, custoProdutos: 0, despesas: 0, lucro: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calcularDRE()
  }, [])

  async function calcularDRE() {
    setLoading(true)
    
    // 1. Receita Total (Soma das Vendas)
    const { data: vendas } = await supabase.from('vendas').select('valor_total')
    const receita = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0

    // 2. Custo dos Produtos Vendidos (CMV)
    // Precisamos pegar os itens vendidos e multiplicar pelo preço de CUSTO original
    const { data: itensVendidos } = await supabase.from('venda_itens').select('quantidade, produtos(preco_custo)')
    
    let custoProd = 0
    itensVendidos?.forEach((item: any) => {
      // item.produtos pode ser um array ou objeto dependendo da resposta, garantimos aqui
      const custoUnitario = item.produtos?.preco_custo || 0
      custoProd += (item.quantidade * custoUnitario)
    })

    // 3. Despesas Operacionais (Gastos lançados)
    const { data: gastos } = await supabase.from('despesas').select('valor')
    const totalDespesas = gastos?.reduce((acc, g) => acc + g.valor, 0) || 0

    // 4. Resultado Final
    setDados({
      receita,
      custoProdutos: custoProd,
      despesas: totalDespesas,
      lucro: receita - custoProd - totalDespesas
    })
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center">Calculando resultados...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">DRE - Demonstrativo de Resultado</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        {/* Receita Bruta */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
          <div>
            <p className="text-sm font-bold text-blue-800 uppercase">Receita Bruta (Vendas)</p>
            <p className="text-xs text-blue-600">Total vendido em produtos</p>
          </div>
          <span className="text-2xl font-bold text-blue-700">+ R$ {dados.receita.toFixed(2)}</span>
        </div>

        {/* Custos Variáveis */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">(-) Custo dos Produtos (CMV)</p>
            <p className="text-xs text-gray-400">Matéria-prima e produção dos itens vendidos</p>
          </div>
          <span className="text-xl font-medium text-red-500">- R$ {dados.custoProdutos.toFixed(2)}</span>
        </div>

        {/* Margem de Contribuição */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-gray-700">(=) Lucro Bruto</span>
          <span className="font-bold text-gray-800">R$ {(dados.receita - dados.custoProdutos).toFixed(2)}</span>
        </div>

        {/* Despesas Operacionais */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">(-) Despesas Operacionais</p>
            <p className="text-xs text-gray-400">Aluguel, Estande, Marketing, Viagem</p>
          </div>
          <span className="text-xl font-medium text-red-500">- R$ {dados.despesas.toFixed(2)}</span>
        </div>

        {/* RESULTADO FINAL */}
        <div className={`p-8 flex justify-between items-center ${dados.lucro >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div>
            <p className="text-lg font-bold uppercase">Resultado Líquido (Lucro/Prejuízo)</p>
            <p className="text-sm opacity-80">O que sobrou no bolso</p>
          </div>
          <span className="text-4xl font-bold">R$ {dados.lucro.toFixed(2)}</span>
        </div>

      </div>
    </div>
  )
}