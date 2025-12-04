'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Info, Tag } from 'lucide-react'
import Link from 'next/link'

export default function NovoProduto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    preco_venda: '',
    categoria: 'Bolsas' // Valor padrão
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          preco_custo: 0, 
          preco_venda: parseFloat(formData.preco_venda.replace(',', '.')),
          categoria: formData.categoria // Salva a categoria
        }
      ])

    setLoading(false)

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      router.push('/producao') 
    }
  }

  return (
    <main className="p-4 max-w-md mx-auto bg-[#f9f8f6] min-h-screen text-[#5d4a2f]">
      <div className="flex items-center mb-6">
        <Link href="/produtos" className="text-gray-500 hover:text-[#5d4a2f] mr-4 p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Novo Produto</h1>
      </div>

      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-lg shadow-sm border border-[#dedbcb] space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Nome do Produto</label>
          <input name="nome" required placeholder="Ex: Bolsa Carteiro"
            className="w-full p-3 border rounded-lg focus:border-[#8f7355] outline-none text-[#5d4a2f]" onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">SKU (Código)</label>
                <input name="sku" placeholder="Ex: BLS-001"
                    className="w-full p-3 border rounded-lg uppercase focus:border-[#8f7355] outline-none text-[#5d4a2f]" onChange={handleChange} />
            </div>
            
            {/* SELETOR DE CATEGORIA NOVO */}
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Tag size={12}/> Categoria</label>
                <select name="categoria" className="w-full p-3 border rounded-lg bg-white focus:border-[#8f7355] outline-none text-[#5d4a2f]" onChange={handleChange}>
                    <option value="Bolsas">Bolsas</option>
                    <option value="Cintos">Cintos</option>
                    <option value="Carteiras">Carteiras</option>
                    <option value="Selaria">Selaria</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-400 mb-1">Preço de Venda (R$)</label>
           <input name="preco_venda" type="number" step="0.01" placeholder="0.00" required
              className="w-full p-3 border rounded-lg text-green-700 font-bold focus:border-green-500 outline-none" onChange={handleChange} />
        </div>

        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex gap-2 items-start border border-blue-100">
            <Info size={16} className="mt-0.5 shrink-0"/>
            <p>O <strong>Preço de Custo</strong> será calculado automaticamente na Ficha Técnica.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#8f7355] text-white p-3 rounded-lg font-bold hover:bg-[#5d4a2f] transition-colors disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
          {loading ? 'Salvando...' : <><Save size={20} /> Salvar e Criar Receita</>}
        </button>

      </form>
    </main>
  )
}