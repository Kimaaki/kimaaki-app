'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Phone, X, MessageCircle, User } from 'lucide-react'
import { useRealTimeChat, ChatMessage } from '@/hooks/useRealTimeChat'
import { customClasses } from '@/styles/theme'

interface ChatInterfaceProps {
  roomId: string
  userId: string
  userName: string
  chatType: 'support' | 'delivery'
  onClose?: () => void
  orderId?: string
}

export function ChatInterface({ 
  roomId, 
  userId, 
  userName, 
  chatType, 
  onClose,
  orderId 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    messages, 
    loading, 
    connected, 
    sendMessage, 
    markAsRead,
    getUnreadCount 
  } = useRealTimeChat(roomId, userId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return

    const result = await sendMessage(message, 'customer')
    
    if (result.success) {
      setMessage('')
    }
  }

  const handleMessageClick = (msg: ChatMessage) => {
    if (!msg.read && msg.sender_id !== userId) {
      markAsRead(msg.id)
    }
  }

  const getChatTitle = () => {
    return chatType === 'support' ? 'Suporte YAFOOD' : 'Chat com Entregador'
  }

  const getOtherParticipantAvatar = () => {
    return chatType === 'support' 
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isMyMessage = (senderId: string) => senderId === userId

  if (loading) {
    return (
      <Card className={customClasses.cardRegular}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745] mx-auto"></div>
          <p className="mt-2 text-[#6c757d]">Conectando ao chat...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${customClasses.cardRegular} h-[500px] flex flex-col`}>
      {/* Header do Chat */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={getOtherParticipantAvatar()} />
              <AvatarFallback>
                {chatType === 'support' ? 'S' : 'E'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-[#000000]">{getChatTitle()}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={connected ? 'default' : 'secondary'}
                  className={connected ? 'bg-[#28a745] text-white' : ''}
                >
                  {connected ? 'Online' : 'Desconectado'}
                </Badge>
                {orderId && (
                  <span className="text-xs text-[#6c757d]">Pedido #{orderId.slice(-6)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {chatType === 'delivery' && (
              <Button variant="outline" size="sm" className="border-[#28a745] text-[#28a745]">
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Área de Mensagens */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#6c757d]" />
                <p className="text-[#6c757d]">
                  {chatType === 'support' 
                    ? 'Olá! Como podemos ajudar você hoje?' 
                    : 'Converse com seu entregador'}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                  onClick={() => handleMessageClick(msg)}
                >
                  <div className={`max-w-[80%] ${isMyMessage(msg.sender_id) ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isMyMessage(msg.sender_id)
                          ? 'bg-[#28a745] text-white'
                          : 'bg-gray-100 text-[#000000]'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div className={`flex items-center mt-1 space-x-2 ${
                      isMyMessage(msg.sender_id) ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs text-[#6c757d]">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {!msg.read && !isMyMessage(msg.sender_id) && (
                        <div className="w-2 h-2 bg-[#28a745] rounded-full"></div>
                      )}
                    </div>
                  </div>
                  {!isMyMessage(msg.sender_id) && (
                    <Avatar className="w-8 h-8 order-1 mr-2">
                      <AvatarImage src={getOtherParticipantAvatar()} />
                      <AvatarFallback>
                        {msg.sender_type === 'support' ? 'S' : 'E'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input de Mensagem */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className={customClasses.inputPrimary + " flex-1"}
              disabled={!connected}
            />
            <Button
              type="submit"
              className={customClasses.btnPrimary}
              disabled={!message.trim() || !connected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {isTyping && (
            <p className="text-xs text-[#6c757d] mt-2">
              {chatType === 'support' ? 'Suporte' : 'Entregador'} está digitando...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}