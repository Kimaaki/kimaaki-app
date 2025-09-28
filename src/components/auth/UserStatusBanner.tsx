"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Building2, 
  Truck, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { supabase, getUserRegistration } from '@/lib/supabase'

interface UserStatusBannerProps {
  userId: string
  userRole?: string
  userStatus?: string
}

export function UserStatusBanner({ userId, userRole, userStatus }: UserStatusBannerProps) {
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const roleConfig = {
    cliente: {
      title: 'Cliente',
      icon: User,
      color: 'bg-blue-500',
      description: 'Conta de cliente para fazer pedidos'
    },
    empresa: {
      title: 'Empresa',
      icon: Building2,
      color: 'bg-green-500',
      description: 'Conta empresarial para vender produtos'
    },
    entregador: {
      title: 'Entregador',
      icon: Truck,
      color: 'bg-orange-500',
      description: 'Conta de entregador para fazer entregas'
    },
    admin: {
      title: 'Administrador',
      icon: Shield,
      color: 'bg-red-500',
      description: 'Conta administrativa do sistema'
    }
  }

  const statusConfig = {
    pending: {
      title: 'Aguardando Aprovação',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      description: 'Seu cadastro está sendo analisado pela equipe'
    },
    approved: {
      title: 'Aprovado',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Sua conta foi aprovada e está ativa'
    },
    rejected: {
      title: 'Rejeitado',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      description: 'Seu cadastro foi rejeitado'
    }
  }

  useEffect(() => {
    loadUserRegistration()
  }, [userId])

  const loadUserRegistration = async () => {
    try {
      setLoading(true)
      const { data, error } = await getUserRegistration(userId)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao carregar registro:', error)
        return
      }
      
      setRegistration(data)
    } catch (error) {
      console.error('Erro ao carregar registro do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  // Se não há registro ou está carregando, não mostrar banner
  if (loading || !registration) {
    return null
  }

  // Se o usuário está aprovado e é cliente, não mostrar banner (experiência normal)
  if (registration.status === 'approved' && registration.role === 'cliente') {
    return null
  }

  const role = registration.role || userRole || 'cliente'
  const status = registration.status || userStatus || 'approved'
  
  const RoleIcon = roleConfig[role as keyof typeof roleConfig]?.icon || User
  const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || CheckCircle
  
  const roleInfo = roleConfig[role as keyof typeof roleConfig] || roleConfig.cliente
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.approved

  return (
    <Card className={`border-2 ${statusInfo.color.includes('yellow') ? 'border-yellow-200' : statusInfo.color.includes('green') ? 'border-green-200' : 'border-red-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 ${roleInfo.color} rounded-full flex items-center justify-center flex-shrink-0`}>
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Conta {roleInfo.title}
              </h3>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.title}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {statusInfo.description}
            </p>
            
            {/* Informações específicas por status */}
            {status === 'pending' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Tempo estimado de análise: 24-48 horas
                </p>
                {registration.role !== 'cliente' && (
                  <p className="text-xs text-gray-500">
                    Contas de {roleInfo.title.toLowerCase()} passam por verificação manual
                  </p>
                )}
              </div>
            )}
            
            {status === 'rejected' && registration.rejection_reason && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
                <p className="text-xs text-red-800 dark:text-red-200">
                  <strong>Motivo:</strong> {registration.rejection_reason}
                </p>
              </div>
            )}
            
            {status === 'approved' && registration.role !== 'cliente' && (
              <div className="flex items-center space-x-2 mt-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700 dark:text-green-300">
                  Sua conta {roleInfo.title.toLowerCase()} está ativa e funcionando
                </p>
              </div>
            )}
          </div>
          
          {/* Ações */}
          <div className="flex-shrink-0">
            {status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadUserRegistration}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            )}
            
            {status === 'rejected' && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  // Aqui poderia abrir um modal para novo cadastro ou contato com suporte
                  alert('Entre em contato com o suporte para mais informações')
                }}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Suporte
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}