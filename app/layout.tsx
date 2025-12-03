import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Image from 'next/image' // Importante para usar o logo
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, DollarSign, Truck, FileText, User, Layers, ShoppingBag, Settings 
} from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haras do Sul - Gestão',
  description: 'Sistema de controle Haras do Sul',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-white h-screen flex overflow-hidden`}>
        
        <aside className="w-64 bg-[#0a3d91] text-white flex flex-col justify-between shadow-xl z-10 overflow-y-auto">
          <div>
            {/* LOGO REAL AQUI */}
            <div className="p-6 border-b border-blue-800 flex justify-center">
               {/* Certifique-se que logo.png está na pasta public */}
               <div className="relative w-40 h-40">
                 <Image src="/logo.png" alt="Haras do Sul" fill className="object-contain" />
               </div>
            </div>

            <nav className="mt-6 flex flex-col gap-1 p-2">
              <Link href="/" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><LayoutDashboard size={20}/><span>Visão Geral</span></Link>

              <div className="mt-4 mb-2 px-3 text-xs font-bold text-blue-300 uppercase tracking-wider">Comercial</div>
              <Link href="/vendas" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><ShoppingCart size={20}/><span>PDV / Vendas</span></Link>
              <Link href="/pedidos" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><FileText size={20}/><span>Pedidos B2B</span></Link>
              <Link href="/clientes" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><User size={20}/><span>Clientes / Revenda</span></Link>
              <Link href="/envios" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><Truck size={20}/><span>Envios Online</span></Link>

              <div className="mt-4 mb-2 px-3 text-xs font-bold text-blue-300 uppercase tracking-wider">Produção</div>
              <Link href="/produtos" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><Package size={20}/><span>Produtos Prontos</span></Link>
              <Link href="/producao" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><Layers size={20}/><span>Fichas Técnicas</span></Link>
              <Link href="/insumos" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><ShoppingBag size={20}/><span>Estoque Insumos</span></Link>

              <div className="mt-4 mb-2 px-3 text-xs font-bold text-blue-300 uppercase tracking-wider">Financeiro</div>
              <Link href="/financeiro" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><DollarSign size={20}/><span>Contas & Fluxo</span></Link>
              <Link href="/relatorios" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition"><div className="bg-blue-500 w-5 h-5 flex items-center justify-center rounded text-xs font-bold">R</div><span>Relatório DRE</span></Link>
            </nav>
          </div>

          <div className="p-2 border-t border-blue-800 space-y-1">
            {/* Link Configurações */}
            <Link href="/configuracoes" className="flex items-center gap-3 p-3 w-full text-blue-100 hover:bg-blue-800 rounded-lg transition">
              <Settings size={20} /><span>Configurações</span>
            </Link>
            <button className="flex items-center gap-3 p-3 w-full text-blue-100 hover:bg-blue-800 rounded-lg transition">
              <LogOut size={20} /><span>Sair</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 bg-white text-gray-800">{children}</main>
      </body>
    </html>
  )
}