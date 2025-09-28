"use client"

import { useState, useEffect } from 'react'
import { Bell, X, Check, Clock, Truck, ChefHat, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { customClasses } from '@/styles/theme'

interface PushNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'order_received' | 'preparing' | 'on_way' | 'delivered' | 'promotion' | 'general'
  order_id?: string
  read: boolean
  created_at: string
  data?: any
}

interface NotificationSystemProps {
  userId: string
  onNotificationClick?: (notification: PushNotification) => void
}

export function NotificationSystem({ userId, onNotificationClick }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    requestNotificationPermission()
    loadNotifications()
    subscribeToNotifications()
  }, [userId])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermission(permission)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as PushNotification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          showBrowserNotification(newNotification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showBrowserNotification = (notification: PushNotification) => {
    if (permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: notification.id,
        requireInteraction: true
      })

      browserNotification.onclick = () => {
        window.focus()
        onNotificationClick?.(notification)
        browserNotification.close()
      }

      // Auto-close após 5 segundos
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  const getNotificationIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'order_received':
        return <Check className="w-5 h-5 text-[#28a745]" />
      case 'preparing':
        return <ChefHat className="w-5 h-5 text-[#ffc107]" />
      case 'on_way':
        return <Truck className="w-5 h-5 text-[#17a2b8]" />
      case 'delivered':
        return <MapPin className="w-5 h-5 text-[#28a745]" />
      case 'promotion':
        return <Bell className="w-5 h-5 text-[#dc3545]" />
      default:
        return <Bell className="w-5 h-5 text-[#6c757d]" />
    }
  }

  const getNotificationColor = (type: PushNotification['type']) => {
    switch (type) {
      case 'order_received':
      case 'delivered':
        return 'bg-green-50 border-green-200'
      case 'preparing':
        return 'bg-yellow-50 border-yellow-200'
      case 'on_way':
        return 'bg-blue-50 border-blue-200'
      case 'promotion':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#dc3545] text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de Notificações */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#000000]">Notificações</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#28a745] hover:text-[#1e7e34]"
                    onClick={markAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-[#6c757d]" />
                <p className="text-[#6c757d]">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                      onNotificationClick?.(notification)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-[#000000]' : 'text-[#6c757d]'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-[#6c757d] mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-[#6c757d]">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[#28a745] rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {permission === 'default' && (
            <div className="p-4 border-t border-gray-200 bg-yellow-50">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#ffc107]" />
                <div className="flex-1">
                  <p className="text-xs text-[#6c757d]">
                    Ative as notificações para receber atualizações em tempo real
                  </p>
                </div>
                <Button
                  size="sm"
                  className="text-xs bg-[#ffc107] hover:bg-[#e0a800] text-black"
                  onClick={requestNotificationPermission}
                >
                  Ativar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook para enviar notificações
export const useNotifications = () => {
  const sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: PushNotification['type'],
    orderId?: string,
    data?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          order_id: orderId,
          read: false,
          data
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  const sendOrderStatusNotification = async (
    userId: string,
    orderId: string,
    status: 'received' | 'preparing' | 'on_way' | 'delivered',
    restaurantName?: string
  ) => {
    const notifications = {
      received: {
        title: 'Pedido Recebido!',
        message: `Seu pedido foi recebido${restaurantName ? ` pelo ${restaurantName}` : ''} e está sendo processado.`,
        type: 'order_received' as const
      },
      preparing: {
        title: 'Preparando seu Pedido',
        message: `Seu pedido está sendo preparado${restaurantName ? ` no ${restaurantName}` : ''}. Em breve estará pronto!`,
        type: 'preparing' as const
      },
      on_way: {
        title: 'Pedido a Caminho!',
        message: 'Seu pedido saiu para entrega. Acompanhe a localização do entregador.',
        type: 'on_way' as const
      },
      delivered: {
        title: 'Pedido Entregue!',
        message: 'Seu pedido foi entregue com sucesso. Que tal avaliar sua experiência?',
        type: 'delivered' as const
      }
    }

    const notification = notifications[status]
    await sendNotification(userId, notification.title, notification.message, notification.type, orderId)
  }

  return {
    sendNotification,
    sendOrderStatusNotification
  }
}