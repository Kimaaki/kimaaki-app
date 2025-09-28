"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string, phone: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Criar/atualizar perfil do usuário quando fizer login
      if (event === 'SIGNED_IN' && session?.user) {
        await createOrUpdateUserProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Criar novo perfil
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            preferences: {
              notifications: true,
              dark_mode: false,
              language: 'pt'
            }
          })

        if (error) throw error
      } else {
        // Atualizar perfil existente com dados do OAuth
        const updates: any = {}
        
        if (user.user_metadata?.full_name || user.user_metadata?.name) {
          updates.name = user.user_metadata.full_name || user.user_metadata.name
        }
        
        if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
          updates.avatar_url = user.user_metadata.avatar_url || user.user_metadata.picture
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) throw error
        }
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar perfil:', error)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Erro no login com Google:', error)
      throw new Error('Erro ao fazer login com Google')
    }
  }

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Erro no login com Facebook:', error)
      throw new Error('Erro ao fazer login com Facebook')
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Erro no login com email:', error)
      throw new Error(error.message || 'Erro ao fazer login')
    }
  }

  const signUpWithEmail = async (email: string, password: string, name: string, phone: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      throw new Error(error.message || 'Erro ao criar conta')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error)
      throw new Error('Erro ao fazer logout')
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      throw new Error('Erro ao atualizar perfil')
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Componente de Login/Cadastro
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mail, Phone, Eye, EyeOff, Loader2 } from 'lucide-react'
import { customClasses } from '@/styles/theme'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signInWithGoogle, signInWithFacebook, signInWithEmail, signUpWithEmail, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithFacebook()
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      await signInWithEmail(formData.email, formData.password)
      onOpenChange(false)
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Senhas não coincidem' })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' })
      setIsLoading(false)
      return
    }

    try {
      await signUpWithEmail(formData.email, formData.password, formData.name, formData.phone)
      onOpenChange(false)
      alert('Conta criada com sucesso! Verifique seu email para confirmar.')
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-[#000000]">Entrar no KIMAAKI</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="data-[state=active]:bg-[#28a745] data-[state=active]:text-white">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-[#28a745] data-[state=active]:text-white">
              Cadastrar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {/* Login com OAuth */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Continuar com Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={handleFacebookLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Continuar com Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#6c757d]">Ou</span>
              </div>
            </div>

            {/* Login com Email */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#000000]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={customClasses.inputPrimary}
                  required
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#000000]">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className={customClasses.inputPrimary + " pr-10"}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-[#6c757d]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6c757d]" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {errors.general && (
                <p className="text-sm text-red-600 text-center">{errors.general}</p>
              )}

              <Button
                type="submit"
                className={customClasses.btnPrimary + " w-full"}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {/* Cadastro com OAuth */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Cadastrar com Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={handleFacebookLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Cadastrar com Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#6c757d]">Ou</span>
              </div>
            </div>

            {/* Cadastro com Email */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#000000]">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={customClasses.inputPrimary}
                  required
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#000000]">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="+244 900 000 000"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={customClasses.inputPrimary}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-[#000000]">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={customClasses.inputPrimary}
                  required
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-[#000000]">Senha</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className={customClasses.inputPrimary + " pr-10"}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-[#6c757d]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6c757d]" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[#000000]">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className={customClasses.inputPrimary}
                  required
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {errors.general && (
                <p className="text-sm text-red-600 text-center">{errors.general}</p>
              )}

              <Button
                type="submit"
                className={customClasses.btnPrimary + " w-full"}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}