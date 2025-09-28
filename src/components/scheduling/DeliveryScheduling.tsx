"use client"

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Truck, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { customClasses } from '@/styles/theme'

interface DeliverySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_orders: number
  current_orders: number
  price_modifier: number // Multiplicador do preço (ex: 1.0 = normal, 1.5 = 50% mais caro)
  is_available: boolean
  restaurant_id?: string
}

interface ScheduledDelivery {
  id: string
  user_id: string
  order_id: string
  delivery_slot_id: string
  delivery_address: string
  special_instructions?: string
  status: 'scheduled' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  created_at: string
  delivery_slot: DeliverySlot
}

interface DeliverySchedulingProps {
  userId: string
  restaurantId?: string
  deliveryAddress: string
  onSlotSelected?: (slot: DeliverySlot) => void
  onScheduleConfirmed?: (scheduledDelivery: ScheduledDelivery) => void
}

export function DeliveryScheduling({ 
  userId, 
  restaurantId, 
  deliveryAddress, 
  onSlotSelected,
  onScheduleConfirmed 
}: DeliverySchedulingProps) {
  const [availableSlots, setAvailableSlots] = useState<DeliverySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null)
  const [scheduledDeliveries, setScheduledDeliveries] = useState<ScheduledDelivery[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  useEffect(() => {
    loadAvailableSlots()
    loadScheduledDeliveries()
  }, [restaurantId, selectedDate])

  const loadAvailableSlots = async () => {
    try {
      const startDate = selectedDate || new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Próximos 7 dias

      let query = supabase
        .from('delivery_slots')
        .select('*')
        .eq('is_available', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .lt('current_orders', supabase.raw('max_orders'))

      if (restaurantId) {
        query = query.or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`)
      }

      const { data, error } = await query.order('date').order('start_time')

      if (error) throw error
      setAvailableSlots(data || [])
    } catch (error) {
      console.error('Erro ao carregar horários disponíveis:', error)
    }
  }

  const loadScheduledDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_deliveries')
        .select(`
          *,
          delivery_slot:delivery_slots(*)
        `)
        .eq('user_id', userId)
        .in('status', ['scheduled', 'confirmed', 'preparing'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setScheduledDeliveries(data || [])
    } catch (error) {
      console.error('Erro ao carregar entregas agendadas:', error)
    }
  }

  const scheduleDelivery = async (orderId: string) => {
    if (!selectedSlot) return

    setIsLoading(true)
    try {
      // Criar agendamento
      const { data: scheduledDelivery, error: scheduleError } = await supabase
        .from('scheduled_deliveries')
        .insert({
          user_id: userId,
          order_id: orderId,
          delivery_slot_id: selectedSlot.id,
          delivery_address: deliveryAddress,
          special_instructions: specialInstructions,
          status: 'scheduled'
        })
        .select(`
          *,
          delivery_slot:delivery_slots(*)
        `)
        .single()

      if (scheduleError) throw scheduleError

      // Atualizar contador do slot
      const { error: updateError } = await supabase
        .from('delivery_slots')
        .update({ 
          current_orders: selectedSlot.current_orders + 1 
        })
        .eq('id', selectedSlot.id)

      if (updateError) throw updateError

      onScheduleConfirmed?.(scheduledDelivery)
      setShowScheduleDialog(false)
      setSelectedSlot(null)
      setSpecialInstructions('')
      loadAvailableSlots()
      loadScheduledDeliveries()

    } catch (error) {
      console.error('Erro ao agendar entrega:', error)
      alert('Erro ao agendar entrega. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelScheduledDelivery = async (deliveryId: string) => {
    try {
      const delivery = scheduledDeliveries.find(d => d.id === deliveryId)
      if (!delivery) return

      // Atualizar status para cancelado
      const { error: updateError } = await supabase
        .from('scheduled_deliveries')
        .update({ status: 'cancelled' })
        .eq('id', deliveryId)

      if (updateError) throw updateError

      // Liberar slot
      const { error: slotError } = await supabase
        .from('delivery_slots')
        .update({ 
          current_orders: Math.max(0, delivery.delivery_slot.current_orders - 1)
        })
        .eq('id', delivery.delivery_slot_id)

      if (slotError) throw slotError

      loadScheduledDeliveries()
      loadAvailableSlots()

    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getSlotAvailability = (slot: DeliverySlot) => {
    const available = slot.max_orders - slot.current_orders
    const percentage = (available / slot.max_orders) * 100
    
    if (percentage > 50) return { color: 'text-[#28a745]', text: `${available} vagas` }
    if (percentage > 20) return { color: 'text-[#ffc107]', text: `${available} vagas` }
    return { color: 'text-[#dc3545]', text: `${available} vagas` }
  }

  const getDeliveryFee = (slot: DeliverySlot, basePrice: number = 500) => {
    return Math.round(basePrice * slot.price_modifier)
  }

  const groupSlotsByDate = (slots: DeliverySlot[]) => {
    return slots.reduce((groups, slot) => {
      const date = slot.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(slot)
      return groups
    }, {} as Record<string, DeliverySlot[]>)
  }

  const groupedSlots = groupSlotsByDate(availableSlots)

  return (
    <div className="space-y-6">
      {/* Entregas Agendadas */}
      {scheduledDeliveries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#000000] mb-4">Entregas Agendadas</h3>
          <div className="space-y-3">
            {scheduledDeliveries.map((delivery) => (
              <Card key={delivery.id} className={customClasses.cardRegular}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#28a745] rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#000000]">
                          {formatDate(delivery.delivery_slot.date)}
                        </p>
                        <p className="text-sm text-[#6c757d]">
                          {formatTime(delivery.delivery_slot.start_time)} - {formatTime(delivery.delivery_slot.end_time)}
                        </p>
                        <p className="text-xs text-[#6c757d]">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {delivery.delivery_address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        delivery.status === 'scheduled' ? customClasses.badgeSecondary :
                        delivery.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                        customClasses.badgeSuccess
                      }>
                        {delivery.status === 'scheduled' && 'Agendado'}
                        {delivery.status === 'confirmed' && 'Confirmado'}
                        {delivery.status === 'preparing' && 'Preparando'}
                        {delivery.status === 'out_for_delivery' && 'Saiu para entrega'}
                      </Badge>
                      {delivery.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-600 hover:text-red-700"
                          onClick={() => cancelScheduledDelivery(delivery.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agendar Nova Entrega */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogTrigger asChild>
          <Button className={customClasses.btnPrimary + " w-full"}>
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Entrega
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolha o Horário de Entrega</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filtro por Data */}
            <div>
              <Label>Filtrar por data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={customClasses.inputPrimary}
              />
            </div>

            {/* Horários Disponíveis */}
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date}>
                  <h4 className="font-medium text-[#000000] mb-3 capitalize">
                    {formatDate(date)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const availability = getSlotAvailability(slot)
                      const deliveryFee = getDeliveryFee(slot)
                      const isSelected = selectedSlot?.id === slot.id

                      return (
                        <Card
                          key={slot.id}
                          className={`cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? 'border-[#28a745] bg-green-50' 
                              : 'hover:border-[#28a745] hover:shadow-md'
                          }`}
                          onClick={() => {
                            setSelectedSlot(slot)
                            onSlotSelected?.(slot)
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-[#28a745]" />
                                <span className="font-medium text-[#000000]">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </span>
                              </div>
                              {slot.price_modifier !== 1.0 && (
                                <Badge className="bg-[#ffc107] text-black text-xs">
                                  {slot.price_modifier > 1.0 ? '+' : ''}{((slot.price_modifier - 1) * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className={availability.color}>
                                {availability.text}
                              </span>
                              <span className="text-[#000000] font-medium">
                                Taxa: {deliveryFee.toLocaleString()} Kz
                              </span>
                            </div>

                            {slot.price_modifier !== 1.0 && (
                              <p className="text-xs text-[#6c757d] mt-2">
                                {slot.price_modifier > 1.0 
                                  ? 'Horário de pico - taxa adicional'
                                  : 'Horário promocional - desconto na taxa'
                                }
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(groupedSlots).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-[#6c757d]" />
                <p className="text-[#6c757d]">Nenhum horário disponível</p>
                <p className="text-sm text-[#6c757d]">
                  {selectedDate 
                    ? 'Tente selecionar outra data'
                    : 'Todos os horários estão ocupados'
                  }
                </p>
              </div>
            )}

            {/* Instruções Especiais */}
            {selectedSlot && (
              <div>
                <Label>Instruções especiais para entrega (opcional)</Label>
                <textarea
                  placeholder="Ex: Entregar na portaria, tocar campainha, etc."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className={customClasses.inputPrimary + " min-h-[80px] resize-none"}
                />
              </div>
            )}

            {/* Resumo da Entrega */}
            {selectedSlot && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-[#000000] mb-2">Resumo do Agendamento</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="font-medium">{formatDate(selectedSlot.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span className="font-medium">
                        {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega:</span>
                      <span className="font-medium">
                        {getDeliveryFee(selectedSlot).toLocaleString()} Kz
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Endereço:</span>
                      <span className="font-medium text-right max-w-[200px]">{deliveryAddress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowScheduleDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                className={customClasses.btnPrimary + " flex-1"}
                onClick={() => scheduleDelivery('temp-order-id')} // Em produção, usar ID real do pedido
                disabled={!selectedSlot || isLoading}
              >
                {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entrega Imediata vs Agendada */}
      <Card className={customClasses.cardRegular}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-[#28a745]" />
              <div>
                <p className="font-medium text-[#000000]">Entrega Imediata</p>
                <p className="text-sm text-[#6c757d]">30-45 minutos • Taxa: 500 Kz</p>
              </div>
            </div>
            <Button className={customClasses.btnSecondary}>
              Escolher
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para gerenciar slots de entrega (para administradores)
export const useDeliverySlots = () => {
  const createDeliverySlot = async (slotData: Omit<DeliverySlot, 'id' | 'current_orders'>) => {
    try {
      const { data, error } = await supabase
        .from('delivery_slots')
        .insert({
          ...slotData,
          current_orders: 0
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar slot de entrega:', error)
      throw error
    }
  }

  const updateDeliverySlot = async (slotId: string, updates: Partial<DeliverySlot>) => {
    try {
      const { data, error } = await supabase
        .from('delivery_slots')
        .update(updates)
        .eq('id', slotId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar slot de entrega:', error)
      throw error
    }
  }

  const deleteDeliverySlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_slots')
        .delete()
        .eq('id', slotId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar slot de entrega:', error)
      throw error
    }
  }

  return {
    createDeliverySlot,
    updateDeliverySlot,
    deleteDeliverySlot
  }
}