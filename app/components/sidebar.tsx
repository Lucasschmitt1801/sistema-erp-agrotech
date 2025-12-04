'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, DollarSign, Truck, FileText, User, Layers, ShoppingBag, Settings, Shield 
} from 'lucide-react'

export default function Sidebar() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false) // Estado para controlar visibilidade

  // VERIFICAÇÃO DE ADMIN AO CARREGAR
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Lógica: Se o email for admin@empresa.com OU conter a palavra "admin"
      if (session?.user?.email === 'admin@empresa.com' || session?.user?.email?.includes('admin')) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    }
    
    checkUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login') // Use replace para não deixar voltar pelo botão "voltar"
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#5d4a2f] text-[#dedbcb] flex flex-col justify-between shadow-2xl z-10 overflow-y-auto font-medium transition-all h-full">
      <div>
        {/* LOGO */}
        <div className="p-6 border-b border-[#8f7355]/30 flex justify-center bg-[#5d4a2f]">
            <div className="relative w-40 h-40">
                <Image src="/logo.png" alt="Haras do Sul" fill className="object-contain" priority />
            </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1 p-3">
            <Link href="/" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors duration-200">
                <LayoutDashboard size={20}/><span>Visão Geral</span>
            </Link>

            {/* MÓDULO COMERCIAL */}
            <div className="mt-6 mb-2 px-3 text-xs font-bold text-[#9c8b73] opacity-80 uppercase tracking-widest">
                Comercial
            </div>
            <Link href="/vendas" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <ShoppingCart size={20}/><span>PDV / Vendas</span>
            </Link>
            <Link href="/pedidos" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <FileText size={20}/><span>Pedidos B2B</span>
            </Link>
            <Link href="/clientes" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <User size={20}/><span>Clientes / Revenda</span>
            </Link>
            <Link href="/envios" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <Truck size={20}/><span>Envios Online</span>
            </Link>

            {/* MÓDULO PRODUÇÃO */}
            <div className="mt-6 mb-2 px-3 text-xs font-bold text-[#9c8b73] opacity-80 uppercase tracking-widest">
                Produção
            </div>
            <Link href="/produtos" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <Package size={20}/><span>Produtos Prontos</span>
            </Link>
            <Link href="/producao" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <Layers size={20}/><span>Fichas Técnicas</span>
            </Link>
            <Link href="/insumos" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <ShoppingBag size={20}/><span>Estoque Insumos</span>
            </Link>

            {/* MÓDULO FINANCEIRO */}
            <div className="mt-6 mb-2 px-3 text-xs font-bold text-[#9c8b73] opacity-80 uppercase tracking-widest">
                Financeiro
            </div>
            <Link href="/financeiro" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <DollarSign size={20}/><span>Contas & Fluxo</span>
            </Link>
            <Link href="/relatorios" className="flex items-center gap-3 p-3 text-white hover:bg-[#8f7355] rounded-lg transition-colors">
                <div className="bg-[#dedbcb] text-[#5d4a2f] w-5 h-5 flex items-center justify-center rounded text-xs font-bold">R</div>
                <span>Relatório DRE</span>
            </Link>
        </nav>
      </div>

      <div className="p-2 border-t border-[#8f7355]/30 space-y-1 bg-[#4e3d26]">
        
        {/* RENDERIZAÇÃO CONDICIONAL DO ADMIN */}
        {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 p-3 w-full text-[#dedbcb] hover:bg-[#8f7355] rounded-lg transition-colors">
                <Shield size={20} /><span>Painel Admin</span>
            </Link>
        )}

        <Link href="/configuracoes" className="flex items-center gap-3 p-3 w-full text-[#dedbcb] hover:bg-[#8f7355] rounded-lg transition-colors">
            <Settings size={20} /><span>Configurações</span>
        </Link>
        
        <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full text-[#dedbcb] hover:bg-red-900/50 hover:text-red-200 rounded-lg transition-colors text-left"
        >
            <LogOut size={20} /><span>Sair</span>
        </button>
      </div>
    </aside>
  )
}