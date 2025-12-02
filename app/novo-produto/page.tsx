'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Info } from 'lucide-react'
import Link from 'next/link'

export default function NovoProduto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    preco_venda: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('produtos')
      .insert([
        {
          nome: formData.nome,
          sku: formData.sku.toUpperCase(),
          preco_custo: 0, // Custo inicial zero, será definido na Ficha Técnica
          preco_venda: parseFloat(formData.preco_venda.replace(',', '.'))
        }
      ])

    setLoading(false)

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      router.push('/producao') // Manda direto para a Ficha Técnica para cadastrar a receita
    }
  }

  return (
    <main className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen text-gray-800">
      <div className="flex items-center mb-6">
        <Link href="/produtos" className="text-gray-600 hover:text-gray-900 mr-4 p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Novo Produto</h1>
      </div>

      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1">Nome do Produto</label>
          <input name="nome" required placeholder="Ex: Bolsa Carteiro"
            className="w-full p-3 border rounded-lg" onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1">SKU (Código)</label>
          <input name="sku" placeholder="Ex: BLS-001"
            className="w-full p-3 border rounded-lg uppercase" onChange={handleChange} />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-500 mb-1">Preço de Venda (R$)</label>
           <input name="preco_venda" type="number" step="0.01" placeholder="0.00" required
              className="w-full p-3 border rounded-lg text-green-700 font-bold" onChange={handleChange} />
        </div>

        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex gap-2 items-start">
            <Info size={16} className="mt-0.5 shrink-0"/>
            <p>O <strong>Preço de Custo</strong> será calculado automaticamente depois que você criar a Ficha Técnica deste produto.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-4 flex justify-center items-center gap-2">
          {loading ? 'Salvando...' : <><Save size={20} /> Salvar e Criar Receita</>}
        </button>

      </form>
    </main>
  )
}