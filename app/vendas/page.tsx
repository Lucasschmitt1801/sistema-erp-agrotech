'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, Calculator, DollarSign, Percent, Save, Loader2 
} from 'lucide-react'

export default function PDV() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // --- NOVOS ESTADOS PARA DESCONTO ---
  const [discountValue, setDiscountValue] = useState<string>('') // String para facilitar digitação
  const [discountPercent, setDiscountPercent] = useState<string>('')
  
  // Estado para cliente e pagamento
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [clientName, setClientName] = useState('')

  // 1. Carregar Produtos do Estoque
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    // Busca produtos com saldo de estoque (ajuste conforme sua tabela real)
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, preco, estoque_saldo(quantidade)')
      .limit(50)
    
    if (data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.nome,
        price: p.preco,
        stock: p.estoque_saldo?.[0]?.quantidade || 0
      }))
      setProducts(formatted)
    }
  }

  // 2. Cálculos Matemáticos
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  }, [cart])

  const totalFinal = useMemo(() => {
    const desc = parseFloat(discountValue) || 0
    return Math.max(0, subtotal - desc)
  }, [subtotal, discountValue])

  // 3. Handlers de Desconto Inteligente
  const handleDiscountValueChange = (val: string) => {
    setDiscountValue(val)
    const valNum = parseFloat(val)
    
    if (!val || isNaN(valNum) || subtotal === 0) {
      setDiscountPercent('')
      return
    }

    // Calcula a porcentagem correspondente: (Valor / Subtotal) * 100
    const percent = (valNum / subtotal) * 100
    setDiscountPercent(percent.toFixed(2))
  }

  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercent(val)
    const valNum = parseFloat(val)

    if (!val || isNaN(valNum) || subtotal === 0) {
      setDiscountValue('')
      return
    }

    // Calcula o valor correspondente: (Porcentagem / 100) * Subtotal
    const value = (valNum / 100) * subtotal
    setDiscountValue(value.toFixed(2))
  }

  // 4. Handlers do Carrinho
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    // Reseta descontos ao mudar o carrinho para evitar incoerências
    setDiscountValue('')
    setDiscountPercent('')
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id))
    setDiscountValue('')
    setDiscountPercent('')
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQtd = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQtd }
      }
      return item
    }))
    setDiscountValue('')
    setDiscountPercent('')
  }

  // 5. Finalizar Venda
  const handleFinishSale = async () => {
    if (cart.length === 0) return alert('Carrinho vazio!')
    if (!clientName.trim()) return alert('Informe o nome do cliente (ou "Consumidor")')

    setLoading(true)

    try {
      const saleData = {
        cliente_nome: clientName,
        forma_pagamento: paymentMethod,
        valor_subtotal: subtotal,
        valor_desconto: parseFloat(discountValue) || 0, // Salva o desconto
        valor_total: totalFinal,
        itens: cart, // Em produção, salvaria em tabela separada 'venda_itens'
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('vendas').insert(saleData)

      if (error) throw error

      alert('Venda realizada com sucesso! ✅')
      
      // Limpar tudo
      setCart([])
      setClientName('')
      setDiscountValue('')
      setDiscountPercent('')
      setPaymentMethod('PIX')

    } catch (error: any) {
      alert('Erro ao salvar venda: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtro de produtos
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
      
      {/* ESQUERDA: LISTA DE PRODUTOS */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#dedbcb] flex flex-col overflow-hidden">
        {/* Barra de Busca */}
        <div className="p-4 border-b border-gray-100 bg-[#f9f8f6]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#8f7355] transition-colors"
            />
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col items-start p-4 rounded-lg border border-gray-100 hover:border-[#8f7355] hover:shadow-md transition-all bg-white group text-left"
            >
              <div className="w-full h-24 bg-gray-50 rounded-md mb-3 flex items-center justify-center text-gray-300">
                <ShoppingCart size={32} />
              </div>
              <h4 className="font-bold text-gray-800 line-clamp-2 text-sm h-10">{product.name}</h4>
              <div className="flex justify-between w-full mt-2 items-center">
                <span className="font-bold text-[#5d4a2f]">R$ {product.price.toFixed(2)}</span>
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">Est: {product.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DIREITA: CARRINHO E PAGAMENTO */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg border border-[#dedbcb] flex flex-col h-full">
        <div className="p-4 bg-[#5d4a2f] text-white rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Carrinho</h2>
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{cart.length} itens</span>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-50">
              <ShoppingCart size={48} className="mb-2"/>
              <p>O carrinho está vazio</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)} un</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded border border-gray-200 px-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Minus size={12}/></button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus size={12}/></button>
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="font-bold text-[#5d4a2f] text-sm">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* --- ÁREA DE TOTAIS E DESCONTOS (NOVO) --- */}
        <div className="p-4 bg-[#f9f8f6] border-t border-gray-200 space-y-4">
          
          {/* Inputs do Desconto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                <DollarSign size={12}/> Desconto (R$)
              </label>
              <input 
                type="number" 
                placeholder="0,00"
                value={discountValue}
                onChange={(e) => handleDiscountValueChange(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded p-2 text-right font-medium focus:border-[#8f7355] outline-none text-red-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Percent size={12}/> Desconto (%)
              </label>
              <input 
                type="number" 
                placeholder="0%"
                value={discountPercent}
                onChange={(e) => handleDiscountPercentChange(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded p-2 text-right font-medium focus:border-[#8f7355] outline-none text-red-600"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500 font-medium">
              <span>Desconto</span>
              <span>- R$ {parseFloat(discountValue || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-[#5d4a2f] pt-2">
              <span>Total</span>
              <span>R$ {totalFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Finalização */}
        <div className="p-4 space-y-3 bg-white rounded-b-xl border-t border-gray-100">
          <input 
            type="text" 
            placeholder="Nome do Cliente" 
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#8f7355] outline-none"
          />
          
          <select 
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:border-[#8f7355] outline-none"
          >
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CREDITO">Cartão de Crédito</option>
            <option value="DEBITO">Cartão de Débito</option>
          </select>

          <button 
            onClick={handleFinishSale}
            disabled={loading || cart.length === 0}
            className="w-full bg-[#5d4a2f] text-[#dedbcb] font-bold py-3 rounded-lg hover:bg-[#4a3b25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
            Finalizar Venda
          </button>
        </div>

      </div>
    </div>
  )
}