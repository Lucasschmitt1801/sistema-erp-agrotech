'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, ChevronDown, ChevronUp, Printer } from 'lucide-react'

export default function DRE() {
  const [loading, setLoading] = useState(true)
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [detalhesVisiveis, setDetalhesVisiveis] = useState(false)

  const [dados, setDados] = useState({ 
    receita: 0, 
    custoProdutos: 0, 
    despesas: 0, 
    outrasReceitas: 0,
    lucro: 0,
    margem: 0
  })

  // Para o detalhamento
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<any[]>([])

  useEffect(() => {
    calcularDRE()
  }, [mesAno])

  async function calcularDRE() {
    setLoading(true)
    
    // Definir intervalo do mês
    const [ano, mes] = mesAno.split('-')
    const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1).toISOString()
    const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59).toISOString()

    // 1. Receita (Vendas do mês)
    const { data: vendas } = await supabase.from('vendas')
        .select('valor_total, id')
        .gte('created_at', inicio).lte('created_at', fim)
    
    const receita = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0

    // 2. Custo (CMV) - Baseado nos itens das vendas desse mês
    let custoProd = 0
    if (vendas && vendas.length > 0) {
        const idsVendas = vendas.map(v => v.id)
        const { data: itens } = await supabase.from('venda_itens')
            .select('quantidade, produtos(preco_custo)')
            .in('venda_id', idsVendas)
        
        itens?.forEach((item: any) => {
            custoProd += (item.quantidade * (item.produtos?.preco_custo || 0))
        })
    }

    // 3. Financeiro (Despesas e Receitas Extras do mês)
    const { data: lancamentos } = await supabase.from('despesas')
        .select('valor, tipo, categoria')
        .gte('vencimento', inicio).lte('vencimento', fim)
        .eq('status', 'PAGO') // DRE geralmente é regime de caixa (o que pagou/recebeu)
    
    let totalDespesas = 0
    let totalOutrasReceitas = 0
    const categorias: any = {}

    lancamentos?.forEach((item: any) => {
        if (item.tipo === 'SAIDA') {
            totalDespesas += item.valor
            // Agrupar por categoria
            const cat = item.categoria || 'Geral'
            categorias[cat] = (categorias[cat] || 0) + item.valor
        } else if (item.tipo === 'ENTRADA') {
            totalOutrasReceitas += item.valor
        }
    })

    // Converter objeto de categorias para array ordenado
    const listaCategorias = Object.keys(categorias)
        .map(key => ({ nome: key, valor: categorias[key] }))
        .sort((a, b) => b.valor - a.valor)

    const lucro = receita - custoProd - totalDespesas + totalOutrasReceitas
    const margem = receita > 0 ? (lucro / receita) * 100 : 0

    setDados({ receita, custoProdutos: custoProd, despesas: totalDespesas, outrasReceitas: totalOutrasReceitas, lucro, margem })
    setDespesasPorCategoria(listaCategorias)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto text-gray-800 pb-10">
      
      {/* Cabeçalho com Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded text-sm font-bold">R</div>
          Relatório DRE
        </h1>
        
        <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow border border-gray-200">
            <Calendar size={20} className="text-gray-500"/>
            <input 
                type="month" 
                className="outline-none text-gray-700 font-bold bg-transparent cursor-pointer"
                value={mesAno}
                onChange={e => setMesAno(e.target.value)}
            />
            </div>
            <button onClick={() => window.print()} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 text-gray-600">
                <Printer size={20}/>
            </button>
        </div>
      </div>

      {/* Relatório "Papel" */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 print:shadow-none print:border-0">
        
        <div className="bg-gray-50 p-4 border-b border-gray-200 text-center text-sm text-gray-500 uppercase tracking-widest font-bold">
            Competência: {mesAno}
        </div>

        {/* 1. Receita */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-blue-800 uppercase">1. Receita Operacional Bruta</p>
            <p className="text-xs text-blue-600">Vendas de produtos no período</p>
          </div>
          <span className="text-2xl font-bold text-blue-700">+ R$ {dados.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* 2. Custos */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">2. (-) Custos Variáveis (CMV)</p>
            <p className="text-xs text-gray-400">Custo de matéria-prima dos itens vendidos</p>
          </div>
          <span className="text-xl font-medium text-red-500">- R$ {dados.custoProdutos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* = Lucro Bruto */}
        <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-gray-700">(=) Lucro Bruto</span>
          <span className="font-bold text-gray-800">R$ {(dados.receita - dados.custoProdutos).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        </div>

        {/* 3. Despesas */}
        <div className="border-b border-gray-100">
            <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setDetalhesVisiveis(!detalhesVisiveis)}
            >
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-600 uppercase">3. (-) Despesas Operacionais</p>
                        {detalhesVisiveis ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>
                    <p className="text-xs text-gray-400">Gastos fixos (Aluguel, Luz, Pessoal...)</p>
                </div>
                <span className="text-xl font-medium text-red-500">- R$ {dados.despesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>

            {/* Detalhamento das Despesas (Expansível) */}
            {detalhesVisiveis && (
                <div className="bg-red-50 p-4 pl-10 text-sm space-y-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Detalhamento por Categoria:</p>
                    {despesasPorCategoria.length === 0 ? <p className="italic text-gray-400">Nenhuma despesa lançada.</p> : (
                        despesasPorCategoria.map((cat, idx) => (
                            <div key={idx} className="flex justify-between border-b border-red-100 pb-1 last:border-0">
                                <span className="text-gray-600">{cat.nome}</span>
                                <span className="font-bold text-red-400">R$ {cat.valor.toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

        {/* 4. Outras Receitas */}
        {dados.outrasReceitas > 0 && (
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
            <div>
                <p className="text-sm font-bold text-green-800 uppercase">4. (+) Outras Receitas</p>
                <p className="text-xs text-green-600">Entradas não operacionais</p>
            </div>
            <span className="text-xl font-medium text-green-600">+ R$ {dados.outrasReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
        )}

        {/* = Resultado Final */}
        <div className={`p-8 flex justify-between items-center ${dados.lucro >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div>
            <p className="text-lg font-bold uppercase">(=) Resultado Líquido</p>
            <p className="text-sm opacity-80">Lucro Real no Bolso</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold block">R$ {dados.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            <span className="text-sm opacity-80 font-medium">Margem Líquida: {dados.margem.toFixed(1)}%</span>
          </div>
        </div>

      </div>
      
      {loading && <p className="text-center mt-4 text-gray-400 animate-pulse">Recalculando dados...</p>}
    </div>
  )
}