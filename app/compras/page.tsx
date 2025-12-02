'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Download } from 'lucide-react'

export default function ListaCompras() {
  const [lista, setLista] = useState<any[]>([])

  useEffect(() => {
    async function carregar() {
      // Pega insumos onde estoque < minimo
      const { data } = await supabase.from('insumos').select('*')
      if (data) {
        const precisaComprar = data.filter(i => i.estoque_atual <= i.estoque_minimo)
        setLista(precisaComprar)
      }
    }
    carregar()
  }, [])

  function imprimir() {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-red-600"/> Lista de Compras Sugerida
        </h1>
        <button onClick={imprimir} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 print:hidden">
            <Download size={18}/> Imprimir / PDF
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-center font-bold text-xl mb-6 border-b pb-4">Insumos Abaixo do Estoque Mínimo</h2>
        
        {lista.length === 0 ? (
            <p className="text-center text-green-600 font-bold py-10">Tudo certo! Nenhum insumo em falta.</p>
        ) : (
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-400">
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Estoque Atual</th>
                        <th className="py-2 text-center">Mínimo Ideal</th>
                        <th className="py-2 text-right">Sugestão Compra</th>
                        <th className="py-2 w-10">Check</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {lista.map(item => (
                        <tr key={item.id} className="py-3">
                            <td className="py-3 font-bold">{item.nome}</td>
                            <td className="py-3 text-center text-red-600 font-bold">{item.estoque_atual} {item.unidade}</td>
                            <td className="py-3 text-center text-gray-500">{item.estoque_minimo} {item.unidade}</td>
                            <td className="py-3 text-right font-bold">
                                {Math.ceil((item.estoque_minimo - item.estoque_atual) * 1.2)} {item.unidade} {/* Sugere repor + 20% */}
                            </td>
                            <td className="py-3 text-center"><div className="w-4 h-4 border border-gray-400 rounded"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  )
}