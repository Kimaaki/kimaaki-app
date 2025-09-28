"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, User, LogOut, Chrome, Facebook, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { UserRegistration } from '@/components/auth/UserRegistration'

interface SocialAuthProps {
  onAuthSuccess: (user: any) => void
  onClose: () => void
}

export function SocialAuth({ onAuthSuccess, onClose }: SocialAuthProps) {
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showRegistration, setShowRegistration] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  })

  // Configurar Supabase Auth
  useEffect(() => {
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Usuário logado com sucesso
          await handleAuthSuccess(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = async (user: any) => {
    try {
      // Verificar se o usuário tem registro na tabela user_registrations
      const { data: registration } = await supabase
        .from('user_registrations')
        .select('*')
        .eq('id', user.id)
        .single()

      if (registration) {
        // Verificar status do cadastro
        if (registration.status === 'pending') {
          toast.info('Seu cadastro está pendente de aprovação')
          onClose()
          return
        } else if (registration.status === 'rejected') {
          toast.error('Seu cadastro foi rejeitado. Entre em contato com o suporte.')
          onClose()
          return
        }
      }

      // Verificar se o perfil do usuário já existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            phone: user.user_metadata?.phone || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }
      }

      onAuthSuccess({
        ...user,
        role: registration?.role || 'cliente',
        status: registration?.status || 'approved'
      })
      toast.success('Login realizado com sucesso!')
      onClose()
    } catch (error) {
      console.error('Erro no processo de autenticação:', error)
      toast.error('Erro no processo de login')
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error

    } catch (error: any) {
      console.error('Erro no login com Google:', error)
      toast.error('Erro ao fazer login com Google: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signInWithFacebook = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

    } catch (error: any) {
      console.error('Erro no login com Facebook:', error)
      toast.error('Erro ao fazer login com Facebook: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmail = async () => {
    try {
      setLoading(true)

      if (!formData.email || !formData.password) {
        toast.error('Preencha email e senha')
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      if (data.user) {
        await handleAuthSuccess(data.user)
      }

    } catch (error: any) {
      console.error('Erro no login:', error)
      toast.error('Erro ao fazer login: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async () => {
    try {
      setLoading(true)

      if (!formData.email || !formData.password || !formData.full_name) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone
          }
        }
      })

      if (error) throw error

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // Email já confirmado
          await handleAuthSuccess(data.user)
        } else {
          // Precisa confirmar email
          toast.success('Verifique seu email para confirmar a conta')
          onClose()
        }
      }

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      toast.error('Erro ao criar conta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Logout realizado com sucesso!')
    } catch (error: any) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  const handleRegistrationSuccess = (userData: any) => {
    toast.success('Cadastro realizado com sucesso!')
    setShowRegistration(false)
    onAuthSuccess(userData)
    onClose()
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            {authMode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botões de login social */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <Chrome className="w-4 h-4" />
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'} com Google
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={signInWithFacebook}
              disabled={loading}
            >
              <Facebook className="w-4 h-4" />
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'} com Facebook
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                Ou continue com email
              </span>
            </div>
          </div>

          {/* Formulário de email */}
          <div className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+244 900 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button
              className="w-full bg-[#28a745] hover:bg-[#1e7e34]"
              onClick={authMode === 'login' ? signInWithEmail : signUpWithEmail}
              disabled={loading}
            >
              {loading ? 'Processando...' : (
                authMode === 'login' ? 'Entrar' : 'Criar Conta'
              )}
            </Button>
          </div>

          {/* Cadastro com Roles */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                  Ou cadastre-se como
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
              onClick={() => setShowRegistration(true)}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4" />
              Cliente, Empresa ou Entregador
            </Button>
          </div>

          {/* Alternar entre login e cadastro */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              disabled={loading}
            >
              {authMode === 'login' 
                ? 'Não tem conta? Cadastre-se' 
                : 'Já tem conta? Faça login'
              }
            </Button>
          </div>

          {/* Informações sobre autenticação social */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Ao continuar, você concorda com nossos Termos de Uso</p>
            <p>Seus dados estão protegidos e seguros</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Cadastro com Roles */}
      <UserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  )
}

// Hook para gerenciar estado de autenticação
export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Verificar registro do usuário
          const { data: registration } = await supabase
            .from('user_registrations')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser({
            ...session.user,
            role: registration?.role || 'cliente',
            status: registration?.status || 'approved'
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Verificar registro do usuário
          const { data: registration } = await supabase
            .from('user_registrations')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser({
            ...session.user,
            role: registration?.role || 'cliente',
            status: registration?.status || 'approved'
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      toast.success('Logout realizado com sucesso!')
    } catch (error: any) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}