'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, ShoppingBag, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function DetalheCliente() {
  const params = useParams()
  const [cliente, setCliente] = useState<any>(null)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([]) // Se tivermos o nome do cliente na venda
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) carregarDados(params.id as string)
  }, [params.id])

  async function carregarDados(id: string) {
    // 1. Dados do Cliente
    const { data: cli } = await supabase.from('clientes').select('*').eq('id', id).single()
    setCliente(cli)

    // 2. Pedidos/Orçamentos deste cliente
    const { data: peds } = await supabase.from('pedidos').select('*').eq('cliente_id', id).order('created_at', { ascending: false })
    setPedidos(peds || [])

    // 3. Tentar buscar Vendas finalizadas pelo nome (match simples por enquanto)
    if (cli) {
        const { data: vds } = await supabase.from('vendas').select('*').ilike('cliente_nome', `%${cli.nome_empresa}%`).order('created_at', { ascending: false })
        setVendas(vds || [])
    }

    setLoading(false)
  }

  if (!cliente) return <div className="p-10 text-center">Carregando...</div>

  return (
    <div className="max-w-5xl mx-auto text-[#5d4a2f]">
      <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-[#5d4a2f] mb-6">
        <ArrowLeft size={20}/> Voltar para lista
      </Link>

      {/* CABEÇALHO DO CLIENTE */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dedbcb] mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#8f7355]"></div>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold mb-2">{cliente.nome_empresa}</h1>
                <div className="flex gap-6 text-sm text-gray-600 mt-4">
                    <span className="flex items-center gap-2"><User size={16}/> {cliente.contato_nome}</span>
                    <span className="flex items-center gap-2"><Phone size={16}/> {cliente.telefone}</span>
                    <span className="flex items-center gap-2"><MapPin size={16}/> {cliente.cidade}/{cliente.estado}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Gasto (Estimado)</p>
                <p className="text-3xl font-bold text-[#5d4a2f]">
                    R$ {pedidos.filter(p => p.status === 'FATURADO').reduce((acc, p) => acc + p.valor_final, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA ESQUERDA: PEDIDOS B2B */}
        <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingBag className="text-[#8f7355]"/> Histórico de Pedidos
            </h2>
            <div className="space-y-3">
                {pedidos.length === 0 ? <p className="text-gray-400 italic">Nenhum pedido registrado.</p> : pedidos.map(p => (
                    <Link href={`/pedidos`} key={p.id} className="block bg-white p-4 rounded-lg shadow-sm border border-[#dedbcb] hover:border-[#8f7355] transition">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] px-2 py-1 rounded font-bold 
                                ${p.status === 'ORCAMENTO' ? 'bg-gray-100 text-gray-600' : 
                                  p.status === 'FATURADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.status}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar size={12}/> {new Date(p.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-gray-400">#{p.id.slice(0,8)}</span>
                            <span className="font-bold text-lg">R$ {p.valor_final.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>

        {/* COLUNA DIREITA: VENDAS AVULSAS (PDV) */}
        <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingBag className="text-green-600"/> Vendas PDV (Nome Similar)
            </h2>
            <div className="space-y-3">
                {vendas.length === 0 ? <p className="text-gray-400 italic">Nenhuma venda de PDV encontrada com esse nome.</p> : vendas.map(v => (
                    <div key={v.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 opacity-80">
                        <div className="flex justify-between">
                            <span className="font-bold text-sm text-gray-700">{v.cliente_nome}</span>
                            <span className="font-bold text-green-600">R$ {v.valor_total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{new Date(v.created_at).toLocaleDateString()} • {v.forma_pagamento}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  )
}
```

### Como acessar o histórico?
No arquivo **`src/app/clientes/page.tsx`**, você precisa adicionar um botãozinho para ir para essa página nova.

Procure a parte onde tem os botões de Editar/Excluir (`<Trash2...`) e adicione antes deles:

```tsx
<Link href={`/clientes/${c.id}`} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Ver Histórico">
    <Eye size={16} /> {/* Importe Eye do lucide-react */}
</Link>