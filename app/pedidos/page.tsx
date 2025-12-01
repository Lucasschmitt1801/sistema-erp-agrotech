'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, User, FileText, ShoppingBag, Trash2 } from 'lucide-react'

export default function Pedidos() {
  const [view, setView] = useState('LISTA') // 'LISTA', 'NOVO_PEDIDO'
  const [pedidos, setPedidos] = useState<any[]>([])
  
  // Novo Pedido Data
  const [cliente, setCliente] = useState('')
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])

  useEffect(() => {
    fetchPedidos()
    fetchProdutos()
  }, [])

  async function fetchPedidos() {
    const { data } = await supabase.from('pedidos').select('*, clientes(nome_empresa)').order('created_at', {ascending: false})
    if(data) setPedidos(data)
  }

  async function fetchProdutos() {
    const { data } = await supabase.from('produtos').select('*')
    if(data) setProdutos(data)
  }

  // Funções do Carrinho de Orçamento
  function addItem(prod: any) {
     const exists = carrinho.find(c => c.id === prod.id)
     if(exists) {
         setCarrinho(carrinho.map(c => c.id === prod.id ? {...c, qtd: c.qtd + 1} : c))
     } else {
         setCarrinho([...carrinho, {...prod, qtd: 1}])
     }
  }

  async function salvarPedido() {
    if(!cliente || carrinho.length === 0) return alert('Preencha cliente e itens')
    
    // 1. Criar Cliente (Simplificado: Cria na hora se não existir logica complexa)
    const { data: clienteData } = await supabase.from('clientes').insert([{ nome_empresa: cliente }]).select().single()
    
    // 2. Criar Pedido
    const total = carrinho.reduce((acc, i) => acc + (i.qtd * i.preco_venda), 0)
    const { data: pedidoData } = await supabase.from('pedidos').insert([{ 
        cliente_id: clienteData.id, 
        valor_total: total,
        status: 'ORCAMENTO'
    }]).select().single()

    // 3. Itens
    const itensDB = carrinho.map(c => ({
        pedido_id: pedidoData.id,
        produto_id: c.id,
        quantidade: c.qtd,
        preco_unitario: c.preco_venda
    }))
    await supabase.from('pedido_itens').insert(itensDB)

    alert('Orçamento gerado!')
    setView('LISTA')
    setCarrinho([])
    setCliente('')
    fetchPedidos()
  }

  return (
    <div className="max-w-5xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-blue-600"/> Pedidos & Orçamentos
        </h1>
        {view === 'LISTA' && (
            <button onClick={() => setView('NOVO_PEDIDO')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 font-bold">
                <Plus size={20}/> Novo Orçamento
            </button>
        )}
      </div>

      {view === 'LISTA' ? (
        <div className="grid gap-4">
            {pedidos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{p.clientes?.nome_empresa || 'Cliente sem nome'}</h3>
                        <p className="text-xs text-gray-500">Criado em: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-blue-600 text-lg">R$ {p.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">{p.status}</span>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        /* TELA DE NOVO PEDIDO */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold mb-4">1. Dados do Cliente</h3>
                <input className="w-full border p-3 rounded mb-4 text-gray-900" placeholder="Nome da Empresa / Cliente" 
                    value={cliente} onChange={e => setCliente(e.target.value)} />
                
                <h3 className="font-bold mb-4 mt-6">2. Selecionar Produtos</h3>
                <div className="h-64 overflow-y-auto border rounded p-2 space-y-2">
                    {produtos.map(p => (
                        <div key={p.id} onClick={() => addItem(p)} className="flex justify-between p-2 hover:bg-gray-50 cursor-pointer border-b">
                            <span className="text-sm">{p.nome}</span>
                            <span className="font-bold text-green-600 text-sm">R$ {p.preco_venda}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <h3 className="font-bold mb-4 flex gap-2 items-center"><ShoppingBag size={18}/> Resumo do Orçamento</h3>
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {carrinho.map(c => (
                        <div key={c.id} className="flex justify-between text-sm border-b pb-1">
                            <span>{c.qtd}x {c.nome}</span>
                            <span className="font-bold">R$ {c.qtd * c.preco_venda}</span>
                        </div>
                    ))}
                </div>
                <div className="text-xl font-bold text-right mb-4">
                    Total: R$ {carrinho.reduce((acc, i) => acc + (i.qtd * i.preco_venda), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('LISTA')} className="flex-1 border border-gray-300 py-3 rounded hover:bg-gray-50">Cancelar</button>
                    <button onClick={salvarPedido} className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Gerar Orçamento</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}