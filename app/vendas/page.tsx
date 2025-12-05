'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, DollarSign, Percent, Save, Loader2, Store, History, AlertCircle, CreditCard
} from 'lucide-react'

export default function PDV() {
  const [activeTab, setActiveTab] = useState<'pdv' | 'history'>('pdv')
  const [loading, setLoading] = useState(false)
  
  // --- Estados do PDV ---
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [discountValue, setDiscountValue] = useState<string>('') 
  const [discountPercent, setDiscountPercent] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [clientName, setClientName] = useState('')

  // --- NOVOS ESTADOS: Parcelamento ---
  const [installments, setInstallments] = useState(1) // Quantidade de parcelas
  const [hasInterest, setHasInterest] = useState(false) // Tem juros?
  const [interestRate, setInterestRate] = useState<string>('') // Taxa % de juros

  // --- Estados do Histórico ---
  const [salesHistory, setSalesHistory] = useState<any[]>([])

  // 1. Carregar Produtos (Ao iniciar)
  useEffect(() => {
    fetchProducts()
  }, [])

  // 2. Carregar Histórico (Ao mudar de aba)
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  // 3. Resetar parcelas se mudar forma de pagamento
  useEffect(() => {
    if (paymentMethod !== 'CREDITO') {
      setInstallments(1)
      setHasInterest(false)
      setInterestRate('')
    }
  }, [paymentMethod])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda, estoque_saldo(quantidade)')
        .limit(100)

      if (error) throw error

      if (data) {
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: p.preco_venda, 
          stock: Array.isArray(p.estoque_saldo) 
            ? (p.estoque_saldo[0]?.quantidade || 0) 
            : (p.estoque_saldo?.quantidade || 0)
        }))
        setProducts(formatted)
      }
    } catch (err) {
      console.warn('Modo simples ativado...')
      const { data: basicData } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda')
        .limit(100)
      
      if (basicData) {
        const formattedBasic = basicData.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: p.preco_venda, 
          stock: 0 
        }))
        setProducts(formattedBasic)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setSalesHistory(data)
    setLoading(false)
  }

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta venda do histórico?')) return

    try {
      await supabase.from('venda_itens').delete().eq('venda_id', id)
      const { error } = await supabase.from('vendas').delete().eq('id', id)
      
      if (error) throw error
      
      alert('Venda excluída com sucesso.')
      setSalesHistory(salesHistory.filter(s => s.id !== id))
    } catch (error: any) {
      alert('Erro: ' + error.message)
    }
  }

  // --- CÁLCULOS (Atualizado com Juros) ---
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  }, [cart])

  const totalWithDiscount = useMemo(() => {
    const desc = parseFloat(discountValue) || 0
    return Math.max(0, subtotal - desc)
  }, [subtotal, discountValue])

  const totalFinal = useMemo(() => {
    let final = totalWithDiscount
    
    // Se for Crédito, com Juros e parcelado
    if (paymentMethod === 'CREDITO' && hasInterest && installments > 1) {
      const rate = parseFloat(interestRate) || 0
      // Cálculo simples: Valor + (Valor * %)
      // Você pode ajustar para juros compostos se preferir
      final = final + (final * (rate / 100))
    }
    return final
  }, [totalWithDiscount, paymentMethod, hasInterest, installments, interestRate])

  const installmentValue = useMemo(() => {
    if (installments <= 1) return totalFinal
    return totalFinal / installments
  }, [totalFinal, installments])

  // --- HANDLERS ---
  const handleDiscountValueChange = (val: string) => {
    setDiscountValue(val)
    const valNum = parseFloat(val)
    if (!val || isNaN(valNum) || subtotal === 0) {
      setDiscountPercent('')
      return
    }
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
    const value = (valNum / 100) * subtotal
    setDiscountValue(value.toFixed(2))
  }

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
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

  const handleFinishSale = async () => {
    if (cart.length === 0) return alert('Carrinho vazio!')
    
    const finalClientName = clientName.trim() || 'Consumidor Final'

    setLoading(true)
    try {
      const saleData = {
        cliente_nome: finalClientName,
        forma_pagamento: paymentMethod,
        valor_subtotal: subtotal,
        valor_desconto: parseFloat(discountValue) || 0,
        valor_total: totalFinal, // Salva o valor já com juros
        created_at: new Date().toISOString()
        // Opcional: Se quiser salvar detalhes do parcelamento, precisaria criar colunas novas no Supabase
        // ex: parcelas: installments, juros: interestRate
      }

      const { data: sale, error: saleError } = await supabase
        .from('vendas')
        .insert(saleData)
        .select()
        .single()

      if (saleError) throw saleError

      if (sale) {
        const itemsData = cart.map(item => ({
          venda_id: sale.id,
          produto_id: item.id,
          quantidade: item.quantity,
          preco_unitario: item.price
        }))

        await supabase.from('venda_itens').insert(itemsData)
      }

      alert(`Venda realizada! Total: R$ ${totalFinal.toFixed(2)}`)
      
      // Reset
      setCart([])
      setClientName('')
      setDiscountValue('')
      setDiscountPercent('')
      setPaymentMethod('PIX')
      setInstallments(1)
      setHasInterest(false)
      setInterestRate('')

    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        <button onClick={() => setActiveTab('pdv')} className={`px-4 py-2 rounded-t-lg font-bold flex gap-2 ${activeTab === 'pdv' ? 'bg-[#5d4a2f] text-[#dedbcb]' : 'text-gray-500'}`}><Store size={18}/> Nova Venda</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-t-lg font-bold flex gap-2 ${activeTab === 'history' ? 'bg-[#5d4a2f] text-[#dedbcb]' : 'text-gray-500'}`}><History size={18}/> Histórico</button>
      </div>

      {activeTab === 'pdv' && (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-6">
          
          {/* ESQUERDA: PRODUTOS */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#dedbcb] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-[#f9f8f6]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#8f7355]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
              {filteredProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col justify-between p-3 rounded-lg border border-gray-100 hover:border-[#8f7355] hover:shadow-md transition-all bg-white group text-left h-24"
                >
                  <h4 className="font-bold text-gray-800 line-clamp-2 text-sm leading-tight">{product.name}</h4>
                  <div className="flex justify-between w-full items-end mt-2">
                    <span className="font-bold text-[#5d4a2f] text-lg">R$ {Number(product.price).toFixed(2)}</span>
                    <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-400">Est: {product.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DIREITA: CARRINHO */}
          <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg border border-[#dedbcb] flex flex-col h-full">
            <div className="p-4 bg-[#5d4a2f] text-white rounded-t-xl flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Carrinho</h2>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{cart.length} itens</span>
            </div>

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
                    <p className="text-xs text-gray-500">R$ {Number(item.price).toFixed(2)} un</p>
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

            {/* TOTAIS E CÁLCULOS */}
            <div className="p-4 bg-[#f9f8f6] border-t border-gray-200 space-y-3">
              
              {/* Descontos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Desconto (R$)</label>
                  <input type="number" placeholder="0,00" value={discountValue} onChange={(e) => handleDiscountValueChange(e.target.value)} className="w-full border rounded p-1.5 text-right text-red-600 outline-none focus:border-[#8f7355] text-sm"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Percent size={10}/> Desconto (%)</label>
                  <input type="number" placeholder="0%" value={discountPercent} onChange={(e) => handleDiscountPercentChange(e.target.value)} className="w-full border rounded p-1.5 text-right text-red-600 outline-none focus:border-[#8f7355] text-sm"/>
                </div>
              </div>

              {/* OPÇÕES DE PARCELAMENTO (SÓ APARECE SE FOR CRÉDITO) */}
              {paymentMethod === 'CREDITO' && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-yellow-800 flex items-center gap-1">
                      <CreditCard size={14}/> Parcelas
                    </label>
                    <select 
                      value={installments} 
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="text-sm border border-yellow-300 rounded p-1 bg-white"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>

                  {installments > 1 && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={hasInterest} 
                          onChange={(e) => setHasInterest(e.target.checked)}
                          className="rounded text-[#5d4a2f] focus:ring-[#5d4a2f]"
                        />
                        Cobrar Juros?
                      </label>
                      
                      {hasInterest && (
                        <div className="flex items-center gap-1 w-20">
                          <input 
                            type="number" 
                            placeholder="%" 
                            value={interestRate} 
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full border border-yellow-300 rounded p-1 text-xs text-right"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {installments > 1 && (
                    <div className="text-right text-xs text-yellow-800 font-bold border-t border-yellow-200 pt-2">
                      {installments}x de R$ {installmentValue.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Resumo Final */}
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500 text-xs"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                {parseFloat(discountValue) > 0 && (
                  <div className="flex justify-between text-red-500 text-xs font-medium"><span>Desconto</span><span>- R$ {parseFloat(discountValue).toFixed(2)}</span></div>
                )}
                {hasInterest && paymentMethod === 'CREDITO' && (
                  <div className="flex justify-between text-orange-600 text-xs font-medium">
                    <span>Juros ({interestRate}%)</span>
                    <span>+ R$ {(totalFinal - totalWithDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-[#5d4a2f] pt-1"><span>Total</span><span>R$ {totalFinal.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Finalização */}
            <div className="p-4 space-y-3 bg-white rounded-b-xl border-t border-gray-100">
              <input 
                type="text" 
                placeholder="Nome do Cliente (Opcional)" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#8f7355] outline-none"
              />
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:border-[#8f7355] outline-none">
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CREDITO">Cartão de Crédito</option>
                <option value="DEBITO">Cartão de Débito</option>
              </select>
              <button onClick={handleFinishSale} disabled={loading || cart.length === 0} className="w-full bg-[#5d4a2f] text-[#dedbcb] font-bold py-3 rounded-lg hover:bg-[#4a3b25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>} Finalizar Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#dedbcb] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9f8f6]">
            <div><h2 className="font-bold text-[#5d4a2f]">Histórico</h2><p className="text-xs text-gray-500">Últimas 20</p></div>
            <button onClick={fetchHistory} className="text-sm border px-3 py-1 bg-white rounded hover:bg-gray-50">Atualizar</button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9f8f6] text-gray-500 font-bold sticky top-0"><tr><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Pgto</th><th className="p-4">Total</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y">{salesHistory.map(s => (<tr key={s.id} className="hover:bg-gray-50"><td className="p-4 text-gray-600">{new Date(s.created_at).toLocaleDateString()}</td><td className="p-4 font-bold text-[#5d4a2f]">{s.cliente_nome}</td><td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{s.forma_pagamento}</span></td><td className="p-4 font-bold text-green-600">R$ {Number(s.valor_total).toFixed(2)}</td><td className="p-4 text-right"><button onClick={() => handleDeleteSale(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></td></tr>))}</tbody>
            </table>
            {salesHistory.length === 0 && !loading && <div className="p-12 text-center text-gray-400"><AlertCircle className="mx-auto mb-2"/><p>Sem histórico</p></div>}
          </div>
        </div>
      )}
    </div>
  )
}