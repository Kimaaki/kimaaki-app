'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_type: 'customer' | 'driver' | 'support'
  timestamp: string
  order_id?: string
  read: boolean
}

export interface ChatRoom {
  id: string
  type: 'support' | 'delivery'
  participants: string[]
  order_id?: string
  created_at: string
  updated_at: string
}

export function useRealTimeChat(roomId: string, userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!roomId || !userId) return

    // Carregar mensagens existentes
    loadMessages()

    // Configurar canal de tempo real
    const channel = supabase
      .channel(`chat_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => [...prev, newMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          )
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
  }, [roomId, userId])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string, senderType: 'customer' | 'driver' | 'support' = 'customer') => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content,
          sender_id: userId,
          sender_type: senderType,
          timestamp: new Date().toISOString(),
          read: false,
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, message: data }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error }
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const getUnreadCount = () => {
    return messages.filter(msg => !msg.read && msg.sender_id !== userId).length
  }

  return {
    messages,
    loading,
    connected,
    sendMessage,
    markAsRead,
    getUnreadCount,
  }
}