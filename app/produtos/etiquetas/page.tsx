'use client'

import { useEffect, useState } from 'react'
// Ajuste o caminho do import se necessário (../../lib/supabase)
import { supabase } from '@/lib/supabase' 
import { Search, Printer, Plus, Minus, X, ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'

export default function GeradorEtiquetas() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filaImpressao, setFilaImpressao] = useState<any[]>([])

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    if (data) setProdutos(data)
  }

  function adicionar(produto: any) {
    setFilaImpressao([...filaImpressao, produto])
  }

  function adicionarQuantidade(produto: any, qtd: number) {
    const novos = Array(qtd).fill(produto)
    setFilaImpressao([...filaImpressao, ...novos])
  }

  function limparFila() {
    setFilaImpressao([])
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.sku?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f9f8f6] text-[#5d4a2f]">
      
      {/* --- LADO ESQUERDO: SELEÇÃO --- */}
      <div className="w-full md:w-1/3 bg-white border-r border-[#dedbcb] flex flex-col print:hidden shadow-xl z-10">
        <div className="p-4 border-b border-[#dedbcb] bg-[#5d4a2f] text-[#dedbcb]">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/produtos"><ArrowLeft size={20}/></Link>
                <h1 className="font-bold text-lg">Gerador de Etiquetas</h1>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-[#5d4a2f]" size={18} />
                <input 
                    className="w-full pl-10 pr-4 py-2 rounded text-[#5d4a2f] bg-[#f9f8f6] focus:outline-none placeholder-[#8f7355]"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#f9f8f6]">
            {produtosFiltrados.map(prod => (
                <div key={prod.id} className="flex justify-between items-center p-3 bg-white hover:border-[#8f7355] border border-gray-200 rounded-lg shadow-sm group transition-colors">
                    <div>
                        <p className="font-bold text-sm text-[#5d4a2f]">{prod.nome}</p>
                        <p className="text-xs text-gray-400">{prod.sku}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => adicionar(prod)} className="p-1.5 bg-[#8f7355] text-white rounded hover:bg-[#5d4a2f]" title="Adicionar 1 etiqueta">
                            <Plus size={16}/>
                        </button>
                        <button onClick={() => adicionarQuantidade(prod, 5)} className="text-xs px-2 py-1.5 bg-[#dedbcb] text-[#5d4a2f] rounded hover:bg-[#cfc8b8] font-bold">
                            +5
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 border-t border-[#dedbcb] bg-white space-y-3">
            <div className="flex justify-between text-sm font-bold text-[#5d4a2f]">
                <span>Total de Etiquetas:</span>
                <span>{filaImpressao.length}</span>
            </div>
            <button 
                onClick={() => window.print()}
                disabled={filaImpressao.length === 0}
                className="w-full bg-[#5d4a2f] text-[#dedbcb] py-3 rounded-lg font-bold hover:bg-[#4e3d26] flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
            >
                <Printer size={18}/> Imprimir Página
            </button>
            <button onClick={limparFila} className="w-full text-xs text-red-400 hover:text-red-600 underline text-center">
                Limpar tudo
            </button>
        </div>
      </div>

      {/* --- LADO DIREITO: PREVIEW A4 --- */}
      <div className="flex-1 bg-gray-300 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible flex justify-center">
        
        {/* FOLHA A4 */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[5mm] grid grid-cols-3 content-start gap-[2mm]">
            {filaImpressao.length === 0 ? (
                <div className="col-span-3 h-64 flex flex-col items-center justify-center text-gray-300 print:hidden">
                    <Tag size={48} className="mb-2"/>
                    <p>Adicione produtos para visualizar as etiquetas</p>
                </div>
            ) : (
                filaImpressao.map((item, idx) => (
                    // ETIQUETA INDIVIDUAL
                    <div key={idx} className="border border-dashed border-gray-300 rounded p-2 flex flex-col justify-center items-center text-center h-[35mm] relative break-inside-avoid">
                        {/* Botão remover (só na tela) */}
                        <button 
                            onClick={() => {
                                const novaFila = [...filaImpressao];
                                novaFila.splice(idx, 1);
                                setFilaImpressao(novaFila);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 print:hidden hover:scale-110 transition"
                        >
                            <X size={12}/>
                        </button>

                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#5d4a2f] mb-0.5">Haras do Sul</p>
                        <p className="text-xs font-bold leading-tight line-clamp-2 w-full text-black mb-1">{item.nome}</p>
                        <div className="flex justify-between items-end w-full px-2 mt-auto">
                            <p className="text-[10px] text-gray-500 font-mono">{item.sku}</p>
                            <p className="text-lg font-bold text-black">R$ {item.preco_venda.toFixed(2)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  )
}