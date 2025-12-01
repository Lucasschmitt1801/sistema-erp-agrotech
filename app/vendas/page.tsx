'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ShoppingCart, Trash2, CheckCircle, Calculator } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PDV() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  
  // Estados de Pagamento
  const [pagamento, setPagamento] = useState('DINHEIRO')
  const [valorRecebido, setValorRecebido] = useState('')
  const [troco, setTroco] = useState(0)

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

  // Atualiza o troco sempre que digitar o valor recebido
  useEffect(() => {
    if (pagamento === 'DINHEIRO' && valorRecebido) {
      const recebidoFloat = parseFloat(valorRecebido.replace(',', '.'))
      setTroco(recebidoFloat - total)
    } else {
      setTroco(0)
    }
  }, [valorRecebido, total, pagamento])

  async function finalizarVenda() {
    if (carrinho.length === 0) return
    setProcessando(true)

    try {
      // 1. Criar Venda
      const { data: venda, error: erroVenda } = await supabase
        .from('vendas')
        .insert([{ valor_total: total, forma_pagamento: pagamento }])
        .select().single()

      if (erroVenda) throw erroVenda

      // 2. Itens
      const itensParaSalvar = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda
      }))

      const { error: erroItens } = await supabase.from('venda_itens').insert(itensParaSalvar)
      if (erroItens) throw erroItens

      // 3. Baixar Estoque (Importante!)
      for (const item of carrinho) {
        // Busca o saldo atual
        const { data: saldos } = await supabase
            .from('estoque_saldo')
            .select('quantidade, id')
            .eq('produto_id', item.id)
            .limit(1)

        if (saldos && saldos.length > 0) {
            const saldoAtual = saldos[0].quantidade
            await supabase
                .from('estoque_saldo')
                .update({ quantidade: saldoAtual - item.qtd })
                .eq('id', saldos[0].id)
        }
      }

      alert(`Venda Finalizada! ${troco > 0 ? `Entregar troco de R$ ${troco.toFixed(2)}` : ''}`)
      setCarrinho([])
      setValorRecebido('')
      router.push('/') 
      
    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setProcessando(false)
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.sku?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 text-gray-800">
      
      {/* LADO ESQUERDO: Catálogo */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              // CORRIGIDO: text-gray-900 para garantir letra preta
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-blue-500 text-gray-900 bg-white"
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
              className="flex flex-col items-start p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left bg-white shadow-sm"
            >
              <div className="font-bold text-gray-800 text-sm line-clamp-2">{prod.nome}</div>
              <div className="text-xs text-gray-500 mb-2">{prod.sku}</div>
              <div className="font-bold text-green-600">R$ {prod.preco_venda}</div>
            </button>
          ))}
        </div>
      </div>

      {/* LADO DIREITO: Carrinho */}
      <div className="w-full md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
          <ShoppingCart size={20} /> Carrinho
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {carrinho.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Carrinho vazio.</div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium text-sm text-gray-800">{item.nome}</div>
                  <div className="text-xs text-blue-600 font-bold">{item.qtd}x R$ {item.preco_venda}</div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-gray-800 text-sm">R$ {item.qtd * item.preco_venda}</span>
                   <button onClick={() => removerDoCarrinho(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ÁREA DE PAGAMENTO */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-800">
            <span>Total</span>
            <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="mb-4 space-y-3">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Forma de Pagamento</label>
                <select 
                // CORRIGIDO: text-gray-900
                className="w-full p-2 border rounded-md text-gray-900 bg-white"
                value={pagamento}
                onChange={e => setPagamento(e.target.value)}
                >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                </select>
            </div>

            {/* Se for Dinheiro, mostra calculadora de troco */}
            {pagamento === 'DINHEIRO' && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Valor Recebido (R$)</label>
                    <input 
                        type="number"
                        placeholder="0,00"
                        className="w-full p-2 border rounded text-gray-900"
                        value={valorRecebido}
                        onChange={e => setValorRecebido(e.target.value)}
                    />
                    {troco > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-green-700 font-bold">
                            <Calculator size={16}/> Troco: R$ {troco.toFixed(2)}
                        </div>
                    )}
                     {troco < 0 && valorRecebido && (
                        <div className="mt-2 text-red-600 text-xs font-bold">Falta dinheiro!</div>
                    )}
                </div>
            )}
          </div>

          <button 
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || processando || (pagamento === 'DINHEIRO' && troco < 0)}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-300 flex justify-center items-center gap-2"
          >
            {processando ? 'Processando...' : <><CheckCircle /> Finalizar</>}
          </button>
        </div>
      </div>
    </div>
  )
}