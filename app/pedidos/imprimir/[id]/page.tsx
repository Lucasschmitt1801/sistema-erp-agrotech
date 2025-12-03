'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ImprimirPedido() {
  const params = useParams()
  const [pedido, setPedido] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) fetchDados(params.id as string)
  }, [params.id])

  async function fetchDados(id: string) {
    // Busca Pedido
    const { data: ped } = await supabase.from('pedidos').select('*, clientes(*)').eq('id', id).single()
    // Busca Itens
    const { data: it } = await supabase.from('pedido_itens').select('*, produtos(nome, sku)').eq('pedido_id', id)
    // Busca Dados da Empresa (Config)
    const { data: emp } = await supabase.from('configuracao_empresa').select('*').single()

    if (ped) setPedido(ped)
    if (it) setItens(it)
    if (emp) setEmpresa(emp)
    setLoading(false)
  }

  if (loading) return <div className="p-10 text-center">Gerando documento...</div>
  if (!pedido) return <div className="p-10 text-center">Pedido não encontrado.</div>

  const subtotal = itens.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0)
  
  // Calcular Data de Validade
  const dataCriacao = new Date(pedido.created_at)
  const dataValidade = new Date(dataCriacao)
  dataValidade.setDate(dataValidade.getDate() + (pedido.validade_dias || 15))

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center print:p-0 print:bg-white text-gray-800">
      
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link href="/pedidos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft size={20}/> Voltar</Link>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"><Printer size={20}/> Imprimir / PDF</button>
      </div>

      {/* --- FOLHA A4 --- */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full print:max-w-none relative">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
            <div className="flex items-center gap-6">
                {/* Logo Real */}
                <div className="relative w-24 h-24">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain"/>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">{empresa?.nome_empresa || 'Haras do Sul'}</h1>
                    <p className="text-sm text-gray-500 font-medium">{empresa?.slogan || 'Artigos de Couro'}</p> {/* TEXTO AJUSTADO AQUI */}
                    <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                        <p>{empresa?.cnpj ? `CNPJ: ${empresa.cnpj}` : ''}</p>
                        <p>{empresa?.endereco}</p>
                        <p>{empresa?.telefone} | {empresa?.email}</p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-gray-200">ORÇAMENTO</h2>
                <p className="text-gray-600 font-bold mt-2">#{pedido.id.slice(0,8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">Data: {new Date(pedido.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-red-500 font-bold">Válido até: {dataValidade.toLocaleDateString()}</p>
            </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="flex justify-between mb-10 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="w-1/2">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Cliente</h3>
                <p className="font-bold text-lg text-gray-800">{pedido.clientes?.nome_empresa}</p>
                <p className="text-sm text-gray-600">Att: {pedido.clientes?.contato_nome}</p>
                <p className="text-sm text-gray-600">{pedido.clientes?.email}</p>
            </div>
            <div className="w-1/2 text-right">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Local de Entrega</h3>
                <p className="text-sm text-gray-600">{pedido.clientes?.endereco || 'Endereço não informado'}</p>
                <p className="text-sm text-gray-600">{pedido.clientes?.cidade} / {pedido.clientes?.estado}</p>
                <p className="text-sm text-gray-600 mt-1 font-mono">{pedido.clientes?.cnpj_cpf}</p>
            </div>
        </div>

        {/* ITENS */}
        <table className="w-full mb-8">
            <thead className="bg-gray-800 text-white text-sm uppercase">
                <tr>
                    <th className="py-2 px-4 text-left rounded-tl-lg">Produto</th>
                    <th className="py-2 px-4 text-center">Qtd</th>
                    <th className="py-2 px-4 text-right">Unitário</th>
                    <th className="py-2 px-4 text-right">Desc.</th>
                    <th className="py-2 px-4 text-right rounded-tr-lg">Total</th>
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
                            <td className="py-3 px-4 text-right text-red-400">{item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}</td>
                            <td className="py-3 px-4 text-right font-bold">R$ {totalItem.toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>

        {/* TOTAIS */}
        <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {pedido.desconto_global > 0 && (
                    <div className="flex justify-between text-red-500">
                        <span>Desconto Global ({pedido.desconto_global}%)</span>
                        <span>- R$ {(subtotal * (pedido.desconto_global/100)).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-500 border-b border-gray-300 pb-2">
                    <span>Frete</span>
                    <span>R$ {pedido.valor_frete.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-1">
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
                <p className="text-xs text-gray-900 font-bold uppercase">{empresa?.nome_empresa}</p>
                <p className="text-[10px] text-gray-400">Assinatura do Responsável</p>
            </div>
        </div>

        <div className="mt-10 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            <p>Este documento tem validade de {pedido.validade_dias || 15} dias a partir da data de emissão.</p>
        </div>

      </div>
    </div>
  )
}