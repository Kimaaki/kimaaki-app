"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro na autenticação:', error)
          router.push('/?error=auth_error')
          return
        }

        if (data.session) {
          // Usuário autenticado com sucesso
          router.push('/')
        } else {
          // Não há sessão, redirecionar para home
          router.push('/')
        }
      } catch (error) {
        console.error('Erro no callback de autenticação:', error)
        router.push('/?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745] mx-auto mb-4"></div>
        <p className="text-[#6c757d]">Finalizando autenticação...</p>
      </div>
    </div>
  )
}