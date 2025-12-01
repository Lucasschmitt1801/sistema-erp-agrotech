import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
// AQUI ESTAVA O ERRO: Adicionei o DollarSign na lista de importações abaixo
import { LayoutDashboard, Package, ShoppingCart, LogOut, DollarSign } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fábrica Gestão',
  description: 'Sistema de controle de estoque e vendas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gray-100 h-screen flex overflow-hidden`}>
        
        {/* --- BARRA LATERAL (SIDEBAR) --- */}
        <aside className="w-64 bg-[#0a3d91] text-white flex flex-col justify-between shadow-xl">
          <div>
            {/* Logo / Título */}
            <div className="p-6 flex items-center gap-2 font-bold text-xl border-b border-blue-800">
              <Package size={28} className="text-yellow-400" />
              <span>Fábrica Admin</span>
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
                <span>Realizar Venda</span>
              </Link>

              {/* NOVOS LINKS */}
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

          {/* Botão Sair */}
          <div className="p-4 border-t border-blue-800">
            <button className="flex items-center gap-3 p-3 w-full text-blue-100 hover:bg-blue-800 rounded-lg transition">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </body>
    </html>
  )
}