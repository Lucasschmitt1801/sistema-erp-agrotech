'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DRE() {
  const [dados, setDados] = useState({ 
    receita: 0, 
    custoProdutos: 0, 
    despesas: 0, 
    outrasReceitas: 0, // Novo campo para Entradas do Financeiro
    lucro: 0 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calcularDRE()
  }, [])

  async function calcularDRE() {
    setLoading(true)
    
    // 1. Receita Bruta (Soma das Vendas)
    const { data: vendas } = await supabase.from('vendas').select('valor_total')
    const receita = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0

    // 2. Custo dos Produtos Vendidos (CMV)
    const { data: itensVendidos } = await supabase.from('venda_itens').select('quantidade, produtos(preco_custo)')
    
    let custoProd = 0
    itensVendidos?.forEach((item: any) => {
      const custoUnitario = item.produtos?.preco_custo || 0
      custoProd += (item.quantidade * custoUnitario)
    })

    // 3. Financeiro (Separar Entradas de Saídas)
    const { data: lancamentos } = await supabase.from('despesas').select('valor, tipo')
    
    let totalDespesas = 0
    let totalOutrasReceitas = 0

    lancamentos?.forEach((item: any) => {
        if (item.tipo === 'SAIDA') {
            totalDespesas += item.valor
        } else if (item.tipo === 'ENTRADA') {
            totalOutrasReceitas += item.valor
        }
    })

    // 4. Resultado Final
    // Fórmula: Vendas - Custos - Despesas + Outras Receitas
    setDados({
      receita,
      custoProdutos: custoProd,
      despesas: totalDespesas,
      outrasReceitas: totalOutrasReceitas,
      lucro: receita - custoProd - totalDespesas + totalOutrasReceitas
    })
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Calculando resultados...</div>

  return (
    <div className="max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded text-sm">DRE</div>
        Demonstrativo de Resultado
      </h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        {/* Receita Bruta */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
          <div>
            <p className="text-sm font-bold text-blue-800 uppercase">Receita Bruta (Vendas)</p>
            <p className="text-xs text-blue-600">Total vendido em produtos</p>
          </div>
          <span className="text-2xl font-bold text-blue-700">+ R$ {dados.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* Custos Variáveis */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">(-) Custo dos Produtos (CMV)</p>
            <p className="text-xs text-gray-400">Matéria-prima dos itens vendidos</p>
          </div>
          <span className="text-xl font-medium text-red-500">- R$ {dados.custoProdutos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* Lucro Bruto */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-gray-700">(=) Lucro Bruto</span>
          <span className="font-bold text-gray-800">R$ {(dados.receita - dados.custoProdutos).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* Despesas Operacionais */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">(-) Despesas Operacionais</p>
            <p className="text-xs text-gray-400">Aluguel, Energia, Marketing (Contas Pagas)</p>
          </div>
          <span className="text-xl font-medium text-red-500">- R$ {dados.despesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* Outras Receitas (CORREÇÃO AQUI) */}
        {dados.outrasReceitas > 0 && (
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
            <div>
                <p className="text-sm font-bold text-green-800 uppercase">(+) Outras Receitas</p>
                <p className="text-xs text-green-600">Entradas financeiras diversas</p>
            </div>
            <span className="text-xl font-medium text-green-600">+ R$ {dados.outrasReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
        )}

        {/* RESULTADO FINAL */}
        <div className={`p-8 flex justify-between items-center ${dados.lucro >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div>
            <p className="text-lg font-bold uppercase">Resultado Líquido</p>
            <p className="text-sm opacity-80">Lucro ou Prejuízo Final</p>
          </div>
          <span className="text-4xl font-bold">R$ {dados.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

      </div>
    </div>
  )
}