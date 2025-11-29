'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Plus } from 'lucide-react'

export default function Home() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    if (data) setProdutos(data)
    setLoading(false)
  }

  return (
    <main className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Estoque Fábrica</h1>
        
        {/* CORREÇÃO AQUI: O Link agora age como botão direto */}
       <a 
  href="/novo-produto" 
  className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-700 transition-colors"
>
    <Plus size={24} />
</a>
      </header>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {produtos.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-2"/>
                <p className="text-gray-500">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            produtos.map((prod) => (
              <div key={prod.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border-l-4 border-blue-500">
                <div>
                  <h3 className="font-semibold text-gray-800">{prod.nome}</h3>
                  <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                    SKU: {prod.sku}
                  </p>
                </div>
                <div className="text-right">
                    <span className="block font-bold text-green-600">R$ {prod.preco_venda}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}