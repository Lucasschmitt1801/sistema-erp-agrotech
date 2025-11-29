'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation' // Para poder voltar pra home
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NovoProduto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estado para guardar o que for digitado
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    preco_custo: '',
    preco_venda: '',
  })

  // Função que atualiza o estado quando você digita
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Função que envia para o Banco de Dados
  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault() // Não deixa a página recarregar sozinha
    setLoading(true)

    // Converte "10,50" para "10.50" (banco de dados usa ponto)
    const custo = parseFloat(formData.preco_custo.replace(',', '.')) || 0
    const venda = parseFloat(formData.preco_venda.replace(',', '.')) || 0

    // Envio para o Supabase
    const { error } = await supabase
      .from('produtos')
      .insert([
        {
          nome: formData.nome,
          sku: formData.sku.toUpperCase(), // Salva o SKU em MAIÚSCULO
          preco_custo: custo,
          preco_venda: venda
        }
      ])

    setLoading(false)

    if (error) {
      alert('Erro ao salvar no banco: ' + error.message)
      console.error(error)
    } else {
      alert('Produto cadastrado com sucesso!')
      router.push('/') // Volta para a tela inicial
      router.refresh() // Força a atualização da lista
    }
  }

  return (
    <main className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Cabeçalho com botão de Voltar */}
      <div className="flex items-center mb-6">
        <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4 p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Novo Produto</h1>
      </div>

      {/* O Formulário começa aqui */}
      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
          <input
            name="nome"
            required
            placeholder="Ex: Bolsa de Couro Média"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
          <input
            name="sku"
            placeholder="Ex: BLS-001"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            onChange={handleChange}
          />
        </div>

        {/* Preços lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
            <input
              name="preco_custo"
              type="text" // Usamos text para permitir digitar vírgula
              placeholder="0,00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venda (R$)</label>
            <input
              name="preco_venda"
              type="text"
              placeholder="0,00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-6"
        >
          {loading ? 'Salvando...' : (
            <>
              <Save size={20} /> Salvar Produto
            </>
          )}
        </button>

      </form>
    </main>
  )
}