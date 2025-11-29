'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PDV() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [pagamento, setPagamento] = useState('PIX')

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    if (data) setProdutos(data)
    setLoading(false)
  }

  function adicionarAoCarrinho(produto: any) {
    const itemExistente = carrinho.find(item => item.id === produto.id)
    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.id === produto.id ? { ...item, qtd: item.qtd + 1 } : item
      ))
    } else {
      setCarrinho([...carrinho, { ...produto, qtd: 1 }])
    }
  }

  function removerDoCarrinho(id: string) {
    setCarrinho(carrinho.filter(item => item.id !== id))
  }

  const total = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.qtd), 0)

  async function finalizarVenda() {
    if (carrinho.length === 0) return
    setProcessando(true)

    try {
      // 1. Criar a Venda
      const { data: venda, error: erroVenda } = await supabase
        .from('vendas')
        .insert([{
          valor_total: total,
          forma_pagamento: pagamento,
        }])
        .select()
        .single()

      if (erroVenda) throw erroVenda

      // 2. Criar os Itens da Venda
      const itensParaSalvar = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda
      }))

      const { error: erroItens } = await supabase
        .from('venda_itens')
        .insert(itensParaSalvar)

      if (erroItens) throw erroItens

      // 3. Sucesso!
      alert('Venda realizada com sucesso!')
      setCarrinho([])
      router.push('/') // Volta para o Dashboard para ver o gráfico subir
      
    } catch (error: any) {
      alert('Erro ao finalizar venda: ' + error.message)
    } finally {
      setProcessando(false)
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.sku?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
      
      {/* LADO ESQUERDO: Catálogo */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-blue-500"
              placeholder="Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {produtosFiltrados.map(prod => (
            <button 
              key={prod.id}
              onClick={() => adicionarAoCarrinho(prod)}
              className="flex flex-col items-start p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="font-bold text-gray-800 text-sm line-clamp-2">{prod.nome}</div>
              <div className="text-xs text-gray-500 mb-2">{prod.sku}</div>
              <div className="font-bold text-green-600">R$ {prod.preco_venda}</div>
            </button>
          ))}
        </div>
      </div>

      {/* LADO DIREITO: Carrinho */}
      <div className="w-full md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2">
          <ShoppingCart size={20} />
          Carrinho de Compras
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {carrinho.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              Seu carrinho está vazio.
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium text-sm text-gray-800">{item.nome}</div>
                  <div className="text-xs text-blue-600 font-bold">
                    {item.qtd}x R$ {item.preco_venda}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-gray-800 text-sm">
                     R$ {item.qtd * item.preco_venda}
                   </span>
                   <button onClick={() => removerDoCarrinho(item.id)} className="text-red-400 hover:text-red-600">
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-800">
            <span>Total</span>
            <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pagamento</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={pagamento}
              onChange={e => setPagamento(e.target.value)}
            >
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão Crédito</option>
              <option value="CARTAO_DEBITO">Cartão Débito</option>
            </select>
          </div>

          <button 
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || processando}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-300 flex justify-center items-center gap-2"
          >
            {processando ? 'Processando...' : <><CheckCircle /> Finalizar Venda</>}
          </button>
        </div>
      </div>
    </div>
  )
}