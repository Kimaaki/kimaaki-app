'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { OrderStatus } from '@/lib/types'

export interface OrderUpdate {
  id: string
  order_id: string
  status: OrderStatus
  message: string
  timestamp: string
  location?: {
    lat: number
    lng: number
  }
  estimated_delivery?: string
}

export interface DriverLocation {
  driver_id: string
  lat: number
  lng: number
  timestamp: string
  heading?: number
  speed?: number
}

export function useOrderTracking(orderId: string) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending')
  const [updates, setUpdates] = useState<OrderUpdate[]>([])
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!orderId) return

    // Carregar dados iniciais
    loadOrderData()

    // Configurar canal de tempo real para atualizações do pedido
    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_updates',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const update = payload.new as OrderUpdate
          setUpdates(prev => [...prev, update])
          setOrderStatus(update.status)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const order = payload.new as any
          setOrderStatus(order.status)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const location = payload.new as DriverLocation
          setDriverLocation(location)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const location = payload.new as DriverLocation
          setDriverLocation(location)
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [orderId])

  const loadOrderData = async () => {
    try {
      // Carregar status atual do pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      setOrderStatus(orderData.status)

      // Carregar histórico de atualizações
      const { data: updatesData, error: updatesError } = await supabase
        .from('order_updates')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true })

      if (updatesError) throw updatesError

      setUpdates(updatesData || [])

      // Carregar localização atual do entregador (se disponível)
      const { data: locationData, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (!locationError && locationData) {
        setDriverLocation(locationData)
      }

    } catch (error) {
      console.error('Error loading order data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: OrderStatus, message: string, location?: { lat: number; lng: number }) => {
    try {
      // Atualizar status do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Adicionar atualização ao histórico
      const { error: updateError } = await supabase
        .from('order_updates')
        .insert({
          order_id: orderId,
          status: newStatus,
          message,
          timestamp: new Date().toISOString(),
          location,
        })

      if (updateError) throw updateError

      return { success: true }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error }
    }
  }

  const updateDriverLocation = async (location: { lat: number; lng: number }, driverId: string, heading?: number, speed?: number) => {
    try {
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: driverId,
          order_id: orderId,
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date().toISOString(),
          heading,
          speed,
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating driver location:', error)
      return { success: false, error }
    }
  }

  const getStatusProgress = () => {
    const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered']
    const currentIndex = statusOrder.indexOf(orderStatus)
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  const getEstimatedDeliveryTime = () => {
    const latestUpdate = updates[updates.length - 1]
    return latestUpdate?.estimated_delivery || null
  }

  return {
    orderStatus,
    updates,
    driverLocation,
    loading,
    connected,
    updateOrderStatus,
    updateDriverLocation,
    getStatusProgress,
    getEstimatedDeliveryTime,
  }
}