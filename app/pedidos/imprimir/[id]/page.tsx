'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ImprimirPedido() {
  const params = useParams()
  const [pedido, setPedido] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) fetchDados(params.id as string)
  }, [params.id])

  async function fetchDados(id: string) {
    const { data: ped } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .eq('id', id)
        .single()
    
    const { data: it } = await supabase
        .from('pedido_itens')
        .select('*, produtos(nome, sku)')
        .eq('pedido_id', id)

    if (ped) setPedido(ped)
    if (it) setItens(it)
    setLoading(false)
  }

  // Se estiver carregando
  if (loading) return <div className="p-10 text-center">Gerando documento...</div>
  if (!pedido) return <div className="p-10 text-center">Pedido não encontrado.</div>

  // Cálculos para exibição
  const subtotal = itens.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0)
  
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center print:p-0 print:bg-white">
      
      {/* Barra de Ferramentas (Não sai na impressão) */}
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link href="/pedidos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20}/> Voltar
        </Link>
        <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
            <Printer size={20}/> Imprimir / Salvar PDF
        </button>
      </div>

      {/* --- FOLHA A4 (O DOCUMENTO) --- */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full print:max-w-none">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
            <div className="flex items-center gap-4">
                {/* Logo Simulado */}
                <div className="bg-yellow-400 text-blue-900 w-16 h-16 flex items-center justify-center rounded font-serif font-extrabold text-3xl">
                    H
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">Haras do Sul</h1>
                    <p className="text-sm text-gray-500">Artigos de Couro e Selaria</p>
                    <p className="text-xs text-gray-400 mt-1">CNPJ: 00.000.000/0001-00</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-gray-200">ORÇAMENTO</h2>
                <p className="text-gray-600 font-bold mt-2">#{pedido.id.slice(0,8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">Data: {new Date(pedido.created_at).toLocaleDateString()}</p>
            </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="flex justify-between mb-10">
            <div className="w-1/2">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Cliente</h3>
                <p className="font-bold text-lg text-gray-800">{pedido.clientes?.nome_empresa}</p>
                <p className="text-sm text-gray-600">{pedido.clientes?.contato_nome}</p>
                <p className="text-sm text-gray-600">{pedido.clientes?.email}</p>
                <p className="text-sm text-gray-600">{pedido.clientes?.telefone}</p>
            </div>
            <div className="w-1/2 text-right">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Endereço de Entrega</h3>
                <p className="text-sm text-gray-600">{pedido.clientes?.endereco || 'Não informado'}</p>
                <p className="text-sm text-gray-600">
                    {pedido.clientes?.cidade} {pedido.clientes?.estado ? `- ${pedido.clientes?.estado}` : ''}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-mono">
                    CNPJ/CPF: {pedido.clientes?.cnpj_cpf || '-'}
                </p>
            </div>
        </div>

        {/* TABELA DE ITENS */}
        <table className="w-full mb-8">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                <tr>
                    <th className="py-3 px-4 text-left">Produto / Descrição</th>
                    <th className="py-3 px-4 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-right">Desc.</th>
                    <th className="py-3 px-4 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
                {itens.map((item, idx) => {
                    const totalItem = (item.quantidade * item.preco_unitario) * (1 - (item.desconto_percentual || 0)/100)
                    return (
                        <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="py-3 px-4">
                                <span className="font-bold block">{item.produtos?.nome}</span>
                                <span className="text-xs text-gray-400">{item.produtos?.sku}</span>
                            </td>
                            <td className="py-3 px-4 text-center">{item.quantidade}</td>
                            <td className="py-3 px-4 text-right">R$ {item.preco_unitario.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-red-400">
                                {item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold">R$ {totalItem.toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>

        {/* TOTAIS */}
        <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {pedido.desconto_global > 0 && (
                    <div className="flex justify-between text-red-500">
                        <span>Desconto ({pedido.desconto_global}%)</span>
                        <span>- R$ {(subtotal * (pedido.desconto_global/100)).toFixed(2)}</span>
                    </div>
                )}
                {pedido.valor_frete > 0 && (
                    <div className="flex justify-between text-gray-500">
                        <span>Frete</span>
                        <span>+ R$ {pedido.valor_frete.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 border-t-2 border-gray-800 pt-2 mt-2">
                    <span>TOTAL</span>
                    <span>R$ {pedido.valor_final.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* OBSERVAÇÕES E ASSINATURA */}
        <div className="grid grid-cols-2 gap-10 mt-auto">
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Observações</h4>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded h-24 border border-gray-100">
                    {pedido.observacoes || 'Sem observações adicionais.'}
                </div>
            </div>
            <div className="flex flex-col justify-end items-center text-center">
                <div className="w-48 border-b border-gray-400 mb-2"></div>
                <p className="text-xs text-gray-500 font-bold uppercase">Haras do Sul</p>
                <p className="text-[10px] text-gray-400">Assinatura / Responsável</p>
            </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-10 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            <p>Este documento é um orçamento e tem validade de 15 dias.</p>
            <p>Gerado eletronicamente pelo Sistema Haras do Sul.</p>
        </div>

      </div>
    </div>
  )
}