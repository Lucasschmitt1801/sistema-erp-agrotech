'use client'

import { useState } from 'react'
// Ajuste o caminho do import conforme necessário (ex: ../../lib/supabase)
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Mail, Loader2 } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Erro ao entrar: ' + error.message)
      setLoading(false)
    } else {
      router.push('/') // Vai para o Dashboard
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f8f6] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#dedbcb]">
        
        <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 mb-4">
                <Image src="/logo.png" alt="Haras do Sul" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold text-[#5d4a2f]">Acesso Restrito</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão Haras do Sul</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">E-mail</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20}/>
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#8f7355] focus:ring-2 focus:ring-[#8f7355]/20 outline-none transition-all text-gray-800"
                        placeholder="admin@haras.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20}/>
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#8f7355] focus:ring-2 focus:ring-[#8f7355]/20 outline-none transition-all text-gray-800"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#5d4a2f] text-white py-3 rounded-lg font-bold hover:bg-[#4a3b25] transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#5d4a2f]/20"
            >
                {loading ? <Loader2 className="animate-spin"/> : 'Entrar no Sistema'}
            </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
            © 2025 Haras do Sul. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}