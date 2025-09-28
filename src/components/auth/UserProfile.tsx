'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings, 
  LogOut, 
  Edit, 
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface UserProfileProps {
  onClose: () => void
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, signOut, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados do formulário de edição
  const [editForm, setEditForm] = useState({
    name: user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '',
  })

  const handleLogout = async () => {
    setLogoutLoading(true)
    setError(null)
    
    try {
      const { error } = await signOut()
      if (error) {
        setError('Erro ao fazer logout. Tente novamente.')
      } else {
        onClose()
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setUpdateLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Aqui você pode implementar a atualização do perfil via Supabase
      // Por enquanto, vamos simular o sucesso
      setSuccess('Perfil atualizado com sucesso!')
      setIsEditing(false)
      
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setUpdateLoading(false)
    }
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="text-center py-8">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Usuário não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações do usuário */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      name: user?.user_metadata?.name || '',
                      phone: user?.user_metadata?.phone || '',
                    })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <LoadingButton
                  size="sm"
                  loading={updateLoading}
                  onClick={handleUpdateProfile}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </LoadingButton>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getInitials(user.user_metadata?.name || user.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">
                  {user.user_metadata?.name || 'Usuário'}
                </h2>
                {user.email_confirmed_at && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Membro desde {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{user.user_metadata?.name || 'Não informado'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+244 900 000 000"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{user.user_metadata?.phone || 'Não informado'}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Endereços salvos</span>
              </div>
              <Button variant="outline" size="sm">
                Gerenciar
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>Notificações por email</span>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-sm text-muted-foreground">Pedidos realizados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">4.8</p>
              <p className="text-sm text-muted-foreground">Avaliação média</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <LoadingButton
            variant="destructive"
            className="w-full"
            loading={logoutLoading}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  )
}