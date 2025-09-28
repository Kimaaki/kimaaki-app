'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Phone, MessageCircle } from 'lucide-react'
import { useOrderTracking } from '@/hooks/useOrderTracking'
import { customClasses } from '@/styles/theme'

interface MapLocation {
  lat: number
  lng: number
}

interface DeliveryTrackingProps {
  orderId: string
  customerLocation: MapLocation
  restaurantLocation: MapLocation
  onContactDriver?: () => void
}

export function DeliveryTracking({ 
  orderId, 
  customerLocation, 
  restaurantLocation,
  onContactDriver 
}: DeliveryTrackingProps) {
  const { 
    orderStatus, 
    driverLocation, 
    updates, 
    loading,
    getStatusProgress 
  } = useOrderTracking(orderId)

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: 'Pedido Recebido',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto para Entrega',
      on_way: 'Saiu para Entrega',
      delivered: 'Entregue',
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-purple-500',
      on_way: 'bg-[#28a745]',
      delivered: 'bg-green-600',
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-500'
  }

  const getDistanceToCustomer = () => {
    if (!driverLocation) return null
    
    // Cálculo simples de distância (aproximado)
    const distance = Math.sqrt(
      Math.pow(driverLocation.lat - customerLocation.lat, 2) + 
      Math.pow(driverLocation.lng - customerLocation.lng, 2)
    ) * 111000 // Conversão aproximada para metros
    
    return distance > 1000 
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`
  }

  if (loading) {
    return (
      <Card className={customClasses.cardRegular}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745] mx-auto"></div>
          <p className="mt-2 text-[#6c757d]">Carregando rastreamento...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status do Pedido */}
      <Card className={customClasses.cardRegular}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#000000]">
            <span>Status do Pedido</span>
            <Badge className={`${getStatusColor(orderStatus)} text-white`}>
              {getStatusText(orderStatus)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#28a745] h-2 rounded-full transition-all duration-500"
                style={{ width: `${getStatusProgress()}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#6c757d]">Tempo estimado</p>
                <p className="font-medium text-[#000000]">25-35 min</p>
              </div>
              {driverLocation && (
                <div>
                  <p className="text-[#6c757d]">Distância</p>
                  <p className="font-medium text-[#000000]">{getDistanceToCustomer()}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de Rastreamento Simplificado */}
      <Card className={customClasses.cardRegular}>
        <CardHeader>
          <CardTitle className="flex items-center text-[#000000]">
            <MapPin className="w-5 h-5 mr-2 text-[#28a745]" />
            Rastreamento em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
            {/* Simulação visual de mapa */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-green-200 via-blue-200 to-purple-200"></div>
            </div>
            
            {/* Marcadores simulados */}
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-8">
                {/* Restaurante */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs mt-1 text-gray-600">Restaurante</span>
                </div>
                
                {/* Entregador (se disponível) */}
                {driverLocation && (
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                    <span className="text-xs mt-1 text-gray-600">Entregador</span>
                  </div>
                )}
                
                {/* Cliente */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-xs mt-1 text-gray-600">Você</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                {driverLocation ? 'Entregador a caminho' : 'Aguardando saída do entregador'}
              </p>
            </div>
          </div>
          
          {driverLocation && (
            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={onContactDriver}
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                onClick={onContactDriver}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Atualizações */}
      <Card className={customClasses.cardRegular}>
        <CardHeader>
          <CardTitle className="text-[#000000]">Histórico do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {updates.map((update, index) => (
              <div key={update.id} className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(update.status)}`}></div>
                <div className="flex-1">
                  <p className="font-medium text-[#000000]">{getStatusText(update.status)}</p>
                  <p className="text-sm text-[#6c757d]">{update.message}</p>
                  <p className="text-xs text-[#868e96]">
                    {new Date(update.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}