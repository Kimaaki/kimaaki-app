"use client"

import { useState, useEffect } from 'react'
import { Bell, Check, ChefHat, Truck, MapPin, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { customClasses } from '@/styles/theme'

interface OrderStatus {
  id: string
  order_id: string
  status: 'received' | 'preparing' | 'on_way' | 'delivered'
  restaurant_name: string
  customer_id: string
  created_at: string
  estimated_time?: number
  driver_name?: string
}

interface OrderNotification {
  id: string
  title: string
  message: string
  status: OrderStatus['status']
  timestamp: string
  orderId: string
  restaurantName: string
  read: boolean
}

interface OrderNotificationsProps {
  userId: string
  onNotificationClick?: (notification: OrderNotification) => void
}

export function OrderNotifications({ userId, onNotificationClick }: OrderNotificationsProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [activeNotification, setActiveNotification] = useState<OrderNotification | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    subscribeToOrderUpdates()
    loadRecentNotifications()
  }, [userId])

  const subscribeToOrderUpdates = () => {
    const channel = supabase
      .channel('order-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_updates',
          filter: `customer_id=eq.${userId}`
        },
        (payload) => {
          const orderUpdate = payload.new as OrderStatus
          handleOrderStatusUpdate(orderUpdate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadRecentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_status_updates')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedNotifications = data?.map(update => 
        createNotificationFromUpdate(update)
      ) || []

      setNotifications(formattedNotifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const handleOrderStatusUpdate = (orderUpdate: OrderStatus) => {
    const notification = createNotificationFromUpdate(orderUpdate)
    
    // Adicionar à lista de notificações
    setNotifications(prev => [notification, ...prev.slice(0, 9)])
    
    // Mostrar notificação ativa
    setActiveNotification(notification)
    
    // Mostrar notificação do navegador
    showBrowserNotification(notification)
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
      setActiveNotification(null)
    }, 5000)
  }

  const createNotificationFromUpdate = (update: OrderStatus): OrderNotification => {
    const statusMessages = {
      received: {
        title: 'Pedido Recebido! 🎉',
        message: `Seu pedido foi recebido pelo ${update.restaurant_name} e está sendo processado.`
      },
      preparing: {
        title: 'Preparando seu Pedido 👨‍🍳',
        message: `Seu pedido está sendo preparado no ${update.restaurant_name}. ${update.estimated_time ? `Tempo estimado: ${update.estimated_time} min` : 'Em breve estará pronto!'}`
      },
      on_way: {
        title: 'Pedido a Caminho! 🚚',
        message: `Seu pedido saiu para entrega${update.driver_name ? ` com ${update.driver_name}` : ''}. Acompanhe a localização em tempo real.`
      },
      delivered: {
        title: 'Pedido Entregue! ✅',
        message: 'Seu pedido foi entregue com sucesso. Que tal avaliar sua experiência?'
      }
    }

    const statusInfo = statusMessages[update.status]
    
    return {
      id: `${update.order_id}-${update.status}-${Date.now()}`,
      title: statusInfo.title,
      message: statusInfo.message,
      status: update.status,
      timestamp: update.created_at,
      orderId: update.order_id,
      restaurantName: update.restaurant_name,
      read: false
    }
  }

  const showBrowserNotification = (notification: OrderNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: notification.orderId,
        requireInteraction: true
      })

      browserNotification.onclick = () => {
        window.focus()
        onNotificationClick?.(notification)
        browserNotification.close()
      }

      setTimeout(() => {
        browserNotification.close()
      }, 8000)
    }
  }

  const getStatusIcon = (status: OrderStatus['status']) => {
    switch (status) {
      case 'received':
        return <Check className="w-5 h-5 text-[#28a745]" />
      case 'preparing':
        return <ChefHat className="w-5 h-5 text-[#ffc107]" />
      case 'on_way':
        return <Truck className="w-5 h-5 text-[#17a2b8]" />
      case 'delivered':
        return <MapPin className="w-5 h-5 text-[#28a745]" />
      default:
        return <Clock className="w-5 h-5 text-[#6c757d]" />
    }
  }

  const getStatusColor = (status: OrderStatus['status']) => {
    switch (status) {
      case 'received':
        return 'from-green-400 to-green-600'
      case 'preparing':
        return 'from-yellow-400 to-orange-500'
      case 'on_way':
        return 'from-blue-400 to-blue-600'
      case 'delivered':
        return 'from-green-500 to-emerald-600'
      default:
        return 'from-gray-400 to-gray-600'
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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const dismissActiveNotification = () => {
    if (activeNotification) {
      markAsRead(activeNotification.id)
    }
    setActiveNotification(null)
  }

  return (
    <>
      {/* Notificação Ativa (Toast) */}
      {activeNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <Card className={`w-80 shadow-2xl border-0 bg-gradient-to-r ${getStatusColor(activeNotification.status)} text-white`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1 bg-white/20 rounded-full p-2">
                  {getStatusIcon(activeNotification.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">
                        {activeNotification.title}
                      </p>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {activeNotification.message}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-white/80">
                          Pedido #{activeNotification.orderId.slice(-4)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20 text-xs px-3 py-1 h-auto"
                          onClick={() => onNotificationClick?.(activeNotification)}
                        >
                          Ver Pedido
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 ml-2 p-1 h-auto"
                      onClick={dismissActiveNotification}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão de Histórico de Notificações */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          onClick={() => setShowHistory(!showHistory)}
        >
          <Bell className="w-5 h-5" />
          {notifications.filter(n => !n.read).length > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#dc3545] text-white animate-pulse">
              {notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </Button>

        {/* Histórico de Notificações */}
        {showHistory && (
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#000000]">Atualizações de Pedidos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-[#6c757d]" />
                  <p className="text-[#6c757d]">Nenhuma atualização de pedido</p>
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
                        markAsRead(notification.id)
                        onNotificationClick?.(notification)
                        setShowHistory(false)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(notification.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-[#000000]' : 'text-[#6c757d]'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-[#6c757d] mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[#6c757d]">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-[#6c757d]">
                                #{notification.orderId.slice(-4)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[#28a745] rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Hook para simular atualizações de pedido (para demonstração)
export const useOrderStatusSimulator = () => {
  const simulateOrderProgress = async (orderId: string, customerId: string, restaurantName: string) => {
    const statuses: OrderStatus['status'][] = ['received', 'preparing', 'on_way', 'delivered']
    const delays = [0, 5000, 15000, 25000] // Delays em ms

    for (let i = 0; i < statuses.length; i++) {
      setTimeout(async () => {
        try {
          await supabase
            .from('order_status_updates')
            .insert({
              order_id: orderId,
              status: statuses[i],
              restaurant_name: restaurantName,
              customer_id: customerId,
              estimated_time: statuses[i] === 'preparing' ? 15 : undefined,
              driver_name: statuses[i] === 'on_way' ? 'João Silva' : undefined
            })
        } catch (error) {
          console.error('Erro ao simular status:', error)
        }
      }, delays[i])
    }
  }

  return { simulateOrderProgress }
}