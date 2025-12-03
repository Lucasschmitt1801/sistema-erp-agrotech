'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
// ADICIONADO: 'Printer' na importação
import { Plus, FileText, ShoppingBag, ArrowLeft, CheckCircle, Package, XCircle, DollarSign, Save, User, Trash2, Printer } from 'lucide-react'
import Link from 'next/link'

export default function Pedidos() {
  const [view, setView] = useState('LISTA') 
  const [pedidos, setPedidos] = useState<any[]>([])
  
  // Dados Auxiliares
  const [clientes, setClientes] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])

  // Estado do Pedido Atual (Edição/Novo)
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [carrinho, setCarrinho] = useState<any[]>([]) 
  const [valores, setValores] = useState({ frete: 0, descontoGlobal: 0, observacoes: '' })
  const [statusAtual, setStatusAtual] = useState('ORCAMENTO')

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  async function carregarDadosIniciais() {
    const { data: peds } = await supabase.from('pedidos').select('*, clientes(nome_empresa)').order('created_at', {ascending: false})
    const { data: cli } = await supabase.from('clientes').select('*').order('nome_empresa')
    const { data: prod } = await supabase.from('produtos').select('*').order('nome')
    
    if(peds) setPedidos(peds)
    if(cli) setClientes(cli)
    if(prod) setProdutos(prod)
  }

  // --- NOVA FUNÇÃO: DELETAR PEDIDO ---
  async function deletarPedido(e: any, id: string) {
    e.stopPropagation() 
    if(confirm('Tem certeza que deseja EXCLUIR este orçamento? Essa ação não pode ser desfeita.')) {
        await supabase.from('pedidos').delete().match({ id })
        carregarDadosIniciais()
    }
  }

  async function abrirEditor(pedido?: any) {
    if (pedido) {
      setPedidoId(pedido.id)
      setClienteId(pedido.cliente_id)
      setValores({ 
          frete: pedido.valor_frete || 0, 
          descontoGlobal: pedido.desconto_global || 0,
          observacoes: pedido.observacoes || ''
      })
      setStatusAtual(pedido.status)

      const { data: itens } = await supabase.from('pedido_itens').select('*, produtos(nome)').eq('pedido_id', pedido.id)
      
      const itensFormatados = itens?.map((i: any) => ({
          id: i.produto_id,
          nome: i.produtos?.nome,
          qtd: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto_percentual: i.desconto_percentual || 0
      })) || []
      
      setCarrinho(itensFormatados)
    } else {
      setPedidoId(null)
      setClienteId('')
      setCarrinho([])
      setValores({ frete: 0, descontoGlobal: 0, observacoes: '' })
      setStatusAtual('ORCAMENTO')
    }
    setView('FORM')
  }

  function addItem(prod: any) {
     const exists = carrinho.find(c => c.id === prod.id)
     if(exists) {
         setCarrinho(carrinho.map(c => c.id === prod.id ? {...c, qtd: c.qtd + 1} : c))
     } else {
         setCarrinho([...carrinho, {
             id: prod.id, nome: prod.nome, qtd: 1, preco_unitario: prod.preco_venda, desconto_percentual: 0
         }])
     }
  }

  function atualizaItem(id: string, campo: string, valor: number) {
      setCarrinho(carrinho.map(c => c.id === id ? {...c, [campo]: valor} : c))
  }

  function removerItem(id: string) {
      setCarrinho(carrinho.filter(c => c.id !== id))
  }

  const subtotalItens = carrinho.reduce((acc, i) => {
      const valorItem = i.qtd * i.preco_unitario
      const desconto = valorItem * (i.desconto_percentual / 100)
      return acc + (valorItem - desconto)
  }, 0)
  
  const descontoGlobalValor = subtotalItens * (valores.descontoGlobal / 100)
  const totalFinal = subtotalItens - descontoGlobalValor + valores.frete

  async function salvarOuAtualizar() {
    if(!clienteId || carrinho.length === 0) return alert('Preencha cliente e itens')
    
    const dadosPedido = {
        cliente_id: clienteId,
        valor_total: subtotalItens,
        valor_frete: valores.frete,
        desconto_global: valores.descontoGlobal,
        valor_final: totalFinal,
        observacoes: valores.observacoes,
        status: statusAtual
    }

    let idSalvo = pedidoId

    if (pedidoId) {
        await supabase.from('pedidos').update(dadosPedido).eq('id', pedidoId)
        await supabase.from('pedido_itens').delete().eq('pedido_id', pedidoId)
    } else {
        const { data } = await supabase.from('pedidos').insert([dadosPedido]).select().single()
        idSalvo = data.id
    }

    const itensDB = carrinho.map(c => ({
        pedido_id: idSalvo,
        produto_id: c.id,
        quantidade: c.qtd,
        preco_unitario: c.preco_unitario,
        desconto_percentual: c.desconto_percentual
    }))
    await supabase.from('pedido_itens').insert(itensDB)

    alert('Pedido salvo!')
    carregarDadosIniciais()
    if(!pedidoId) setView('LISTA') 
  }

  async function mudarStatus(novoStatus: string) {
      if(!pedidoId) return alert('Salve o pedido antes.')
      
      if(novoStatus === 'FATURADO') {
          if(!confirm('ATENÇÃO: Isso vai gerar uma VENDA no financeiro e baixar estoque. Confirmar?')) return
          const { data: venda } = await supabase.from('vendas').insert([{
              valor_total: totalFinal,
              forma_pagamento: 'FATURADO_B2B',
              cliente_nome: clientes.find(c => c.id === clienteId)?.nome_empresa
          }]).select().single()

          for (const item of carrinho) {
               await supabase.from('venda_itens').insert({
                   venda_id: venda.id, produto_id: item.id, quantidade: item.qtd, 
                   preco_unitario: item.preco_unitario * (1 - item.desconto_percentual/100)
               })
               const { data: saldo } = await supabase.from('estoque_saldo').select('*').eq('produto_id', item.id).limit(1)
               if(saldo && saldo[0]) {
                   await supabase.from('estoque_saldo').update({quantidade: saldo[0].quantidade - item.qtd}).eq('id', saldo[0].id)
               }
          }
      }
      await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId)
      setStatusAtual(novoStatus)
      carregarDadosIniciais()
      alert(`Status alterado para ${novoStatus}`)
  }

  const statusColors: any = {
      'ORCAMENTO': 'bg-gray-100 text-gray-600',
      'APROVADO': 'bg-blue-100 text-blue-600',
      'PRODUCAO': 'bg-purple-100 text-purple-600',
      'ENVIADO': 'bg-orange-100 text-orange-600',
      'FATURADO': 'bg-green-100 text-green-600',
      'CANCELADO': 'bg-red-100 text-red-600',
  }

  return (
    <div className="max-w-6xl mx-auto text-gray-800">
      {view === 'LISTA' ? (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-blue-600"/> Pedidos & Orçamentos</h1>
                <button onClick={() => abrirEditor()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 font-bold hover:bg-blue-700">
                    <Plus size={20}/> Novo Orçamento
                </button>
            </div>
            <div className="grid gap-4">
                {pedidos.map(p => (
                    <div key={p.id} onClick={() => abrirEditor(p)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:border-blue-400 transition group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{p.clientes?.nome_empresa || 'Cliente Removido'}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${statusColors[p.status]}`}>{p.status}</span>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()} • ID: {p.id.slice(0,8)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                                <span className="block font-bold text-gray-800 text-lg">R$ {p.valor_final?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            </div>
                            
                            {/* BOTÃO IMPRIMIR PDF */}
                            <Link 
                                href={`/pedidos/imprimir/${p.id}`} 
                                target="_blank"
                                onClick={(e) => e.stopPropagation()} 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                title="Imprimir PDF"
                            >
                                <Printer size={20} />
                            </Link>

                            {/* BOTÃO EXCLUIR */}
                            <button onClick={(e) => deletarPedido(e, p.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('LISTA')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft/></button>
                    <h2 className="text-xl font-bold">{pedidoId ? 'Editar Pedido' : 'Novo Orçamento'}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4 flex gap-2"><User size={18}/> Cliente</h3>
                    <select className="w-full border p-3 rounded text-gray-900 bg-white" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                        <option value="">Selecione um Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_empresa}</option>)}
                    </select>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4 flex gap-2"><Package size={18}/> Adicionar Produtos</h3>
                    <div className="h-60 overflow-y-auto border rounded p-2 space-y-2">
                        {produtos.map(p => (
                            <div key={p.id} onClick={() => addItem(p)} className="flex justify-between p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                <span className="text-sm font-medium">{p.nome}</span>
                                <span className="font-bold text-green-600 text-sm">R$ {p.preco_venda}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4">Itens do Pedido</h3>
                    {carrinho.length === 0 ? <p className="text-gray-400 text-center py-4">Vazio</p> : (
                        <div className="space-y-3">
                            {carrinho.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-4 items-center border-b pb-3">
                                    <div className="flex-1 font-medium">{item.nome}</div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Qtd:</label>
                                        <input type="number" className="w-16 border p-1 rounded text-center" value={item.qtd} onChange={e => atualizaItem(item.id, 'qtd', Number(e.target.value))}/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Desc(%):</label>
                                        <input type="number" className="w-16 border p-1 rounded text-center" value={item.desconto_percentual} onChange={e => atualizaItem(item.id, 'desconto_percentual', Number(e.target.value))}/>
                                    </div>
                                    <div className="w-24 text-right font-bold text-gray-700">R$ {((item.qtd * item.preco_unitario) * (1 - item.desconto_percentual/100)).toFixed(2)}</div>
                                    <button onClick={() => removerItem(item.id)} className="text-red-500 p-1"><XCircle size={18}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
                    <h3 className="font-bold mb-6 flex gap-2"><DollarSign size={18}/> Totais</h3>
                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>R$ {subtotalItens.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Desconto Global (%)</span><input type="number" className="w-16 border p-1 rounded text-right" value={valores.descontoGlobal} onChange={e => setValores({...valores, descontoGlobal: Number(e.target.value)})}/></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Frete (R$)</span><input type="number" className="w-20 border p-1 rounded text-right" value={valores.frete} onChange={e => setValores({...valores, frete: Number(e.target.value)})}/></div>
                        <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800"><span>Total Final</span><span>R$ {totalFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                    </div>
                    <div className="mb-4"><label className="text-xs font-bold text-gray-500">Observações</label><textarea className="w-full border p-2 rounded h-20 text-sm" value={valores.observacoes} onChange={e => setValores({...valores, observacoes: e.target.value})}/></div>
                    <div className="space-y-3">
                        <button onClick={salvarOuAtualizar} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center gap-2"><Save size={18}/> Salvar</button>
                        {pedidoId && statusAtual !== 'FATURADO' && (
                            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 gap-2">
                                <p className="text-xs font-bold text-gray-400 text-center uppercase mb-1">Fluxo</p>
                                {statusAtual === 'ORCAMENTO' && <button onClick={() => mudarStatus('APROVADO')} className="w-full bg-green-100 text-green-700 py-2 rounded font-bold hover:bg-green-200">Aprovar</button>}
                                {statusAtual === 'APROVADO' && <button onClick={() => mudarStatus('PRODUCAO')} className="w-full bg-purple-100 text-purple-700 py-2 rounded font-bold hover:bg-purple-200">Produzir</button>}
                                {statusAtual === 'PRODUCAO' && <button onClick={() => mudarStatus('ENVIADO')} className="w-full bg-orange-100 text-orange-700 py-2 rounded font-bold hover:bg-orange-200">Enviar</button>}
                                {(statusAtual === 'ENVIADO' || statusAtual === 'APROVADO') && <button onClick={() => mudarStatus('FATURADO')} className="w-full bg-gray-800 text-white py-3 rounded font-bold hover:bg-black flex justify-center gap-2"><CheckCircle size={18}/> Faturar</button>}
                                <button onClick={() => mudarStatus('CANCELADO')} className="w-full text-red-500 text-xs hover:underline mt-2">Cancelar</button>
                            </div>
                        )}
                        {statusAtual === 'FATURADO' && <div className="bg-green-50 text-green-700 p-3 rounded text-center text-sm font-bold border border-green-200">Faturado ✅</div>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}