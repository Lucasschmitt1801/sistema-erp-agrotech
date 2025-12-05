'use client' // <--- OBRIGATÓRIO PARA USAR HOOKS

import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation' // Para saber em qual página estamos
import { supabase } from '../lib/supabase' // Caminho corrigido conforme sua estrutura
import './globals.css'
import Sidebar from './sidebar' // Caminho corrigido (mesma pasta)

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() // Pega a URL atual (ex: '/login', '/vendas')
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Verifica se é a página de login (pública)
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Se já estiver na página de login, não precisa verificar senha, apenas libera
      if (isLoginPage) {
        setIsAuthorized(true)
        return
      }

      // 2. Verifica a sessão no Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Se não tem sessão e não está no login, chuta para o login
        router.push('/login')
      } else {
        // Tem sessão, libera o acesso
        setIsAuthorized(true)
      }
    }

    checkAuth()
  }, [pathname, isLoginPage, router])

  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-[#f9f8f6] h-screen flex overflow-hidden`}>
        
        {/* LÓGICA DO SIDEBAR:
            Só mostra o Sidebar se o usuário estiver autorizado E NÃO for a página de login.
        */}
        {isAuthorized && !isLoginPage && (
          <Sidebar />
        )}

        {/* CONTEÚDO PRINCIPAL:
            Aqui renderiza as páginas (Visão Geral, Vendas, Login, etc).
        */}
        <main className={`flex-1 overflow-y-auto ${isLoginPage ? '' : 'p-8'} bg-[#f9f8f6] text-[#5d4a2f]`}>
          {/* Mostra um "carregando" branco enquanto verifica a permissão para não piscar a tela */}
          {!isAuthorized ? (
             <div className="h-full w-full flex items-center justify-center bg-[#f9f8f6]">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d4a2f]"></div>
             </div>
          ) : (
             children
          )}
        </main>

      </body>
    </html>
  )
}