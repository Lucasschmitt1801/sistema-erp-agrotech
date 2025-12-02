'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, ChevronDown, ChevronUp, Printer, Clock } from 'lucide-react'

export default function DRE() {
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [modo, setModo] = useState<'MES' | 'DIA'>('MES')
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [dataDia, setDataDia] = useState(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD

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

  // Recalcula sempre que mudar o modo ou as datas
  useEffect(() => {
    calcularDRE()
  }, [modo, mesAno, dataDia])

  async function calcularDRE() {
    setLoading(true)
    
    let inicio = ''
    let fim = ''

    // --- LÓGICA DE DATA INTELIGENTE ---
    if (modo === 'MES') {
        const [ano, mes] = mesAno.split('-')
        // Primeiro dia do mês 00:00:00
        inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1).toISOString()
        // Último dia do mês 23:59:59
        fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59, 999).toISOString()
    } else {
        // Modo DIA
        inicio = `${dataDia}T00:00:00.000Z` // Começo do dia
        fim = `${dataDia}T23:59:59.999Z`    // Fim do dia
    }

    // 1. Receita (Vendas no período)
    const { data: vendas } = await supabase.from('vendas')
        .select('valor_total, id')
        .gte('created_at', inicio).lte('created_at', fim)
    
    const receita = vendas?.reduce((acc, v) => acc + v.valor_total, 0) || 0

    // 2. Custo (CMV) - Baseado nos itens das vendas desse período
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

    // 3. Financeiro (Despesas e Receitas Extras no período)
    const { data: lancamentos } = await supabase.from('despesas')
        .select('valor, tipo, categoria')
        .gte('vencimento', inicio).lte('vencimento', fim)
        .eq('status', 'PAGO') 
    
    let totalDespesas = 0
    let totalOutrasReceitas = 0
    const categorias: any = {}

    lancamentos?.forEach((item: any) => {
        if (item.tipo === 'SAIDA') {
            totalDespesas += item.valor
            const cat = item.categoria || 'Geral'
            categorias[cat] = (categorias[cat] || 0) + item.valor
        } else if (item.tipo === 'ENTRADA') {
            totalOutrasReceitas += item.valor
        }
    })

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
        
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {/* Seletor de Modo (Abas) */}
            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <button 
                    onClick={() => setModo('MES')}
                    className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition ${modo === 'MES' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Calendar size={16}/> Por Mês
                </button>
                <div className="w-px bg-gray-200"></div>
                <button 
                    onClick={() => setModo('DIA')}
                    className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition ${modo === 'DIA' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Clock size={16}/> Por Dia
                </button>
            </div>

            {/* Input de Data (Muda conforme o modo) */}
            <div className="bg-white px-2 py-1.5 rounded-lg border border-gray-300 shadow-sm">
                {modo === 'MES' ? (
                    <input type="month" className="outline-none text-gray-700 font-bold bg-transparent cursor-pointer"
                        value={mesAno} onChange={e => setMesAno(e.target.value)} />
                ) : (
                    <input type="date" className="outline-none text-gray-700 font-bold bg-transparent cursor-pointer"
                        value={dataDia} onChange={e => setDataDia(e.target.value)} />
                )}
            </div>

            {/* Botão Imprimir */}
            <button onClick={() => window.print()} className="bg-white p-2 rounded-lg hover:bg-blue-50 text-gray-600 border border-gray-300 shadow-sm" title="Imprimir">
                <Printer size={20}/>
            </button>
        </div>
      </div>

      {/* Relatório "Papel" */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 print:shadow-none print:border-0">
        
        <div className="bg-gray-50 p-4 border-b border-gray-200 text-center text-sm text-gray-500 uppercase tracking-widest font-bold">
            Competência: {modo === 'MES' ? mesAno : new Date(dataDia + 'T12:00:00').toLocaleDateString()}
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