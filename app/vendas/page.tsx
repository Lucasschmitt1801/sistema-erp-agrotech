'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, DollarSign, Percent, Save, Loader2, Store, History, AlertCircle
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

  // --- FUNÇÃO DE BUSCA BLINDADA (Corrigido para preco_venda) ---
  const fetchProducts = async () => {
    setLoading(true)
    try {
      // TENTATIVA 1: Busca completa com estoque
      // IMPORTANTE: Buscando 'preco_venda' conforme seu banco
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda, estoque_saldo(quantidade)')
        .limit(50)

      if (error) throw error

      if (data) {
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: p.preco_venda, // Mapeia a coluna certa
          // Tenta ler estoque como array ou objeto
          stock: Array.isArray(p.estoque_saldo) 
            ? (p.estoque_saldo[0]?.quantidade || 0) 
            : (p.estoque_saldo?.quantidade || 0)
        }))
        setProducts(formatted)
      }
    } catch (err) {
      console.warn('Erro ao carregar estoque, ativando modo de segurança...')
      
      // TENTATIVA 2: Busca simples (sem estoque) para não travar a tela
      const { data: basicData } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda') // Também corrigido aqui
        .limit(50)
      
      if (basicData) {
        const formattedBasic = basicData.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: p.preco_venda, 
          stock: 0 // Mostra 0 mas exibe o produto
        }))
        setProducts(formattedBasic)
      }
    } finally {
      setLoading(false)
    }
  }

  // --- FUNÇÕES DO HISTÓRICO ---
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
      // 1. Primeiro remove os itens da venda (tabela venda_itens)
      await supabase.from('venda_itens').delete().eq('venda_id', id)

      // 2. Depois remove a venda (tabela vendas)
      const { error } = await supabase.from('vendas').delete().eq('id', id)
      
      if (error) throw error
      
      alert('Venda excluída com sucesso.')
      setSalesHistory(salesHistory.filter(s => s.id !== id))
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  // --- CÁLCULOS DO PDV ---
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  }, [cart])

  const totalFinal = useMemo(() => {
    const desc = parseFloat(discountValue) || 0
    return Math.max(0, subtotal - desc)
  }, [subtotal, discountValue])

  // --- HANDLERS DE DESCONTO ---
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

  // --- HANDLERS DO CARRINHO ---
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

  // --- FINALIZAR VENDA (Lógica Corrigida: Salva Venda e depois Itens) ---
  const handleFinishSale = async () => {
    if (cart.length === 0) return alert('Carrinho vazio!')
    if (!clientName.trim()) return alert('Informe o nome do cliente')

    setLoading(true)
    try {
      // 1. Prepara dados da VENDA
      const saleData = {
        cliente_nome: clientName,
        forma_pagamento: paymentMethod,
        valor_subtotal: subtotal,
        valor_desconto: parseFloat(discountValue) || 0,
        valor_total: totalFinal,
        // Removemos 'itens' daqui pois a coluna não existe na tabela 'vendas'
        created_at: new Date().toISOString()
      }

      // 2. Insere a VENDA e retorna o ID gerado
      const { data: sale, error: saleError } = await supabase
        .from('vendas')
        .insert(saleData)
        .select()
        .single()

      if (saleError) throw saleError

      // 3. Insere os ITENS na tabela 'venda_itens'
      if (sale) {
        const itemsData = cart.map(item => ({
          venda_id: sale.id, // Relaciona com a venda criada
          produto_id: item.id,
          quantidade: item.quantity,
          preco_unitario: item.price
        }))

        const { error: itemsError } = await supabase
          .from('venda_itens')
          .insert(itemsData)

        if (itemsError) {
          console.error('Erro ao salvar itens:', itemsError)
          alert('Atenção: Venda criada, mas ocorreu um erro ao salvar os produtos.')
        }
      }

      alert('Venda realizada com sucesso! ✅')
      
      // Limpa a tela
      setCart([])
      setClientName('')
      setDiscountValue('')
      setDiscountPercent('')
      setPaymentMethod('PIX')

    } catch (error: any) {
      alert('Erro ao finalizar venda: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      
      {/* --- MENU DE ABAS --- */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        <button 
          onClick={() => setActiveTab('pdv')}
          className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-colors ${activeTab === 'pdv' ? 'bg-[#5d4a2f] text-[#dedbcb]' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
        >
          <Store size={18} /> Nova Venda
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-[#5d4a2f] text-[#dedbcb]' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
        >
          <History size={18} /> Histórico Recente
        </button>
      </div>

      {/* --- ABA PDV --- */}
      {activeTab === 'pdv' && (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-6">
          
          {/* ESQUERDA: LISTA DE PRODUTOS */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#dedbcb] flex flex-col overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
              {filteredProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-start p-4 rounded-lg border border-gray-100 hover:border-[#8f7355] hover:shadow-md transition-all bg-white group text-left"
                >
                  <div className="w-full h-24 bg-gray-50 rounded-md mb-3 flex items-center justify-center text-gray-300">
                    <Store size={32} />
                  </div>
                  <h4 className="font-bold text-gray-800 line-clamp-2 text-sm h-10">{product.name}</h4>
                  <div className="flex justify-between w-full mt-2 items-center">
                    <span className="font-bold text-[#5d4a2f]">R$ {Number(product.price).toFixed(2)}</span>
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

            <div className="p-4 bg-[#f9f8f6] border-t border-gray-200 space-y-4">
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
      )}

      {/* --- ABA HISTÓRICO --- */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#dedbcb] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9f8f6]">
            <div>
              <h2 className="font-bold text-[#5d4a2f] text-lg">Histórico de Vendas</h2>
              <p className="text-xs text-gray-500">Últimas 20 vendas realizadas</p>
            </div>
            <button 
              onClick={fetchHistory}
              className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
            >
              Atualizar Lista
            </button>
          </div>

          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9f8f6] text-gray-500 font-bold sticky top-0">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Pgto</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesHistory.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-[#5d4a2f]">
                      {sale.cliente_nome}
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {sale.forma_pagamento}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      R$ {Number(sale.valor_total).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteSale(sale.id)}
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                        title="Excluir Venda"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {salesHistory.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <AlertCircle size={48} className="mb-2 opacity-50"/>
                <p>Nenhuma venda encontrada no histórico recente.</p>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-[#5d4a2f]" />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}