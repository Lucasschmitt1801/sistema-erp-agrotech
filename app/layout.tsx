import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// IMPORTANTE: Verifique se o caminho do Sidebar está correto
import Sidebar from '@/components/Sidebar' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haras do Sul - Gestão',
  description: 'Sistema de controle Haras do Sul',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-[#f9f8f6] h-screen flex overflow-hidden`}>
        
        {/* AQUI ESTÁ A MÁGICA: Chamamos o componente isolado */}
        <Sidebar />

        {/* Conteúdo das páginas */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f9f8f6] text-[#5d4a2f]">
          {children}
        </main>

      </body>
    </html>
  )
}