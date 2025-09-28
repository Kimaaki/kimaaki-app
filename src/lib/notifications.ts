import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 4000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <AlertCircle className="w-4 h-4" />,
      duration: 5000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-4 h-4" />,
      duration: 4000,
    })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },

  orderUpdate: (status: string, orderId: string) => {
    const statusMessages = {
      confirmed: 'Pedido confirmado! 🎉',
      preparing: 'Seu pedido está sendo preparado 👨‍🍳',
      on_way: 'Entregador a caminho! 🚗',
      delivered: 'Pedido entregue com sucesso! ✅'
    }

    const message = statusMessages[status as keyof typeof statusMessages] || 'Status do pedido atualizado'
    
    toast.success(message, {
      description: `Pedido #${orderId}`,
      duration: 6000,
      action: {
        label: 'Ver detalhes',
        onClick: () => {
          // Navegar para detalhes do pedido
          console.log('Navigate to order details:', orderId)
        }
      }
    })
  },

  promotion: (title: string, description: string) => {
    toast.info(title, {
      description,
      duration: 8000,
      icon: '🎉',
      action: {
        label: 'Ver oferta',
        onClick: () => {
          // Navegar para promoção
          console.log('Navigate to promotion')
        }
      }
    })
  }
}

// Hook para notificações push (simulado)
export function useNotifications() {
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options
      })
    }
  }

  const sendOrderNotification = (status: string, orderId: string) => {
    const notifications = {
      confirmed: {
        title: 'Pedido Confirmado! 🎉',
        body: `Seu pedido #${orderId} foi confirmado pelo restaurante.`
      },
      preparing: {
        title: 'Preparando seu pedido 👨‍🍳',
        body: `Seu pedido #${orderId} está sendo preparado.`
      },
      on_way: {
        title: 'Entregador a caminho! 🚗',
        body: `Seu pedido #${orderId} está a caminho.`
      },
      delivered: {
        title: 'Pedido entregue! ✅',
        body: `Seu pedido #${orderId} foi entregue com sucesso.`
      }
    }

    const notification = notifications[status as keyof typeof notifications]
    if (notification) {
      sendNotification(notification.title, {
        body: notification.body,
        tag: `order-${orderId}`,
        requireInteraction: true
      })
    }
  }

  return {
    requestPermission,
    sendNotification,
    sendOrderNotification
  }
}