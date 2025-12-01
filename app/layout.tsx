import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, LogOut, DollarSign, Truck } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haras do Sul - Gestão',
  description: 'Sistema de controle Haras do Sul',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      {/* MUDANÇA: bg-white para fundo branco total */}
      <body className={`${inter.className} bg-white h-screen flex overflow-hidden`}>
        
        {/* --- BARRA LATERAL (SIDEBAR) --- */}
        <aside className="w-64 bg-[#0a3d91] text-white flex flex-col justify-between shadow-xl z-10">
          <div>
            {/* Logo / Título Customizado */}
            <div className="p-6 flex items-center gap-2 font-bold text-xl border-b border-blue-800">
              <div className="bg-yellow-400 text-blue-900 p-1 rounded font-serif font-extrabold">H</div>
              <span>Haras do Sul</span>
            </div>

            {/* Menu de Navegação */}
            <nav className="mt-6 flex flex-col gap-1 p-2">
              <Link href="/" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                <LayoutDashboard size={20} />
                <span>Visão Geral</span>
              </Link>

              <Link href="/produtos" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                <Package size={20} />
                <span>Produtos</span>
              </Link>

              <Link href="/vendas" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                <ShoppingCart size={20} />
                <span>PDV / Vendas</span>
              </Link>

              {/* NOVO LINK: Envios/Correios */}
              <Link href="/envios" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                <Truck size={20} />
                <span>Envios Online</span>
              </Link>

              <Link href="/financeiro" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                 <DollarSign size={20} />
                 <span>Financeiro</span>
              </Link>

              <Link href="/relatorios" className="flex items-center gap-3 p-3 text-blue-100 hover:bg-blue-800 rounded-lg transition">
                <div className="bg-blue-500 w-5 h-5 flex items-center justify-center rounded text-xs font-bold">R</div>
                <span>Relatório DRE</span>
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-blue-800">
            <button className="flex items-center gap-3 p-3 w-full text-blue-100 hover:bg-blue-800 rounded-lg transition">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="flex-1 overflow-y-auto p-8 bg-white text-gray-800">
          {children}
        </main>

      </body>
    </html>
  )
}