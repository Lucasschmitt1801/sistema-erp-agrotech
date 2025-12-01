'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, DollarSign, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarVendas()
  }, [])

  async function carregarVendas() {
    setLoading(true)
    // Busca Vendas + Itens + Nome dos Produtos
    const { data } = await supabase
      .from('vendas')
      .select(`
        id, created_at, valor_total, forma_pagamento,
        venda_itens (
          quantidade, preco_unitario,
          produtos (nome)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50) // Pega as ultimas 50 para nao travar

    if (data) setVendas(data)
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto text-gray-800">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/vendas" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
      </div>

      <div className="space-y-4">
        {vendas.map((venda) => (
          <div key={venda.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            
            {/* Cabeçalho da Venda */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                    <DollarSign size={20} />
                </div>
                <div>
                    <p className="font-bold text-gray-900">Venda realizada</p>
                    <p className="text-xs text-gray-500">
                        {new Date(venda.created_at).toLocaleString('pt-BR')} • {venda.forma_pagamento}
                    </p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">
                R$ {venda.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </span>
            </div>

            {/* Lista de Itens */}
            <div className="bg-gray-50 rounded-lg p-3">
                {venda.venda_itens.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                        <span className="text-gray-700">
                            <span className="font-bold">{item.quantidade}x</span> {item.produtos?.nome || 'Produto removido'}
                        </span>
                        <span className="text-gray-500">R$ {item.preco_unitario}</span>
                    </div>
                ))}
            </div>

          </div>
        ))}
        
        {vendas.length === 0 && !loading && (
            <p className="text-center text-gray-400 mt-10">Nenhuma venda registrada ainda.</p>
        )}
      </div>
    </div>
  )
}