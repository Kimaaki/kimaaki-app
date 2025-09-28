"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle } from 'lucide-react'
import { format, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface DeliverySchedulingProps {
  onScheduleSelected: (scheduledTime: Date | null) => void
  restaurantId?: string
  deliveryAddress?: string
}

export function DeliveryScheduling({ onScheduleSelected, restaurantId, deliveryAddress }: DeliverySchedulingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [restaurantHours, setRestaurantHours] = useState<any>(null)
  const [busySlots, setBusySlots] = useState<string[]>([])

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantHours()
    }
    generateTimeSlots()
  }, [restaurantId, selectedDate])

  const loadRestaurantHours = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('opening_hours, is_open')
        .eq('id', restaurantId)
        .single()

      if (error) throw error

      setRestaurantHours(data)
    } catch (error) {
      console.error('Erro ao carregar horários do restaurante:', error)
    }
  }

  const generateTimeSlots = async () => {
    if (!selectedDate) return

    const slots: string[] = []
    const now = new Date()
    const selectedDateStart = startOfDay(selectedDate)
    const selectedDateEnd = endOfDay(selectedDate)
    
    // Horário de funcionamento padrão (9h às 22h)
    const openTime = restaurantHours?.opening_hours?.open || '09:00'
    const closeTime = restaurantHours?.opening_hours?.close || '22:00'
    
    const [openHour, openMinute] = openTime.split(':').map(Number)
    const [closeHour, closeMinute] = closeTime.split(':').map(Number)
    
    let currentSlot = new Date(selectedDate)
    currentSlot.setHours(openHour, openMinute, 0, 0)
    
    const endTime = new Date(selectedDate)
    endTime.setHours(closeHour, closeMinute, 0, 0)

    // Se for hoje, começar pelo menos 30 minutos a partir de agora
    if (format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      const minTime = addMinutes(now, 30)
      if (isAfter(minTime, currentSlot)) {
        currentSlot = minTime
        // Arredondar para o próximo slot de 15 minutos
        const minutes = currentSlot.getMinutes()
        const roundedMinutes = Math.ceil(minutes / 15) * 15
        currentSlot.setMinutes(roundedMinutes, 0, 0)
      }
    }

    // Gerar slots de 15 em 15 minutos
    while (isBefore(currentSlot, endTime)) {
      slots.push(format(currentSlot, 'HH:mm'))
      currentSlot = addMinutes(currentSlot, 15)
    }

    // Carregar slots ocupados
    await loadBusySlots(selectedDate)
    
    setAvailableSlots(slots)
  }

  const loadBusySlots = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const { data, error } = await supabase
        .from('orders')
        .select('scheduled_delivery')
        .eq('restaurant_id', restaurantId)
        .gte('scheduled_delivery', `${dateStr}T00:00:00`)
        .lt('scheduled_delivery', `${dateStr}T23:59:59`)
        .not('status', 'in', '(cancelled)')

      if (error) throw error

      const busy = data?.map(order => {
        if (order.scheduled_delivery) {
          return format(new Date(order.scheduled_delivery), 'HH:mm')
        }
        return null
      }).filter(Boolean) || []

      setBusySlots(busy as string[])
    } catch (error) {
      console.error('Erro ao carregar slots ocupados:', error)
    }
  }

  const validateScheduledTime = async (date: Date, time: string): Promise<boolean> => {
    try {
      setLoading(true)

      const [hours, minutes] = time.split(':').map(Number)
      const scheduledDateTime = new Date(date)
      scheduledDateTime.setHours(hours, minutes, 0, 0)

      // Verificar se é no futuro
      const now = new Date()
      if (!isAfter(scheduledDateTime, addMinutes(now, 30))) {
        toast.error('O agendamento deve ser pelo menos 30 minutos no futuro')
        return false
      }

      // Verificar se o restaurante está aberto nesse horário
      const dayOfWeek = scheduledDateTime.getDay()
      const timeStr = format(scheduledDateTime, 'HH:mm')
      
      // Aqui você pode adicionar lógica mais complexa para verificar horários específicos por dia da semana
      
      // Verificar capacidade de entrega (máximo 5 entregas por slot de 15 minutos)
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('scheduled_delivery', scheduledDateTime.toISOString())
        .not('status', 'in', '(cancelled)')

      if (error) throw error

      if (data && data.length >= 5) {
        toast.error('Este horário está lotado. Escolha outro horário.')
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao validar horário:', error)
      toast.error('Erro ao validar horário de entrega')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione uma data e horário')
      return
    }

    const isValid = await validateScheduledTime(selectedDate, selectedTime)
    if (!isValid) return

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    onScheduleSelected(scheduledDateTime)
    toast.success(`Entrega agendada para ${format(scheduledDateTime, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`)
  }

  const handleClearSchedule = () => {
    setSelectedDate(undefined)
    setSelectedTime('')
    onScheduleSelected(null)
    toast.success('Agendamento removido')
  }

  const isSlotBusy = (time: string) => {
    return busySlots.includes(time)
  }

  const getSlotStatus = (time: string) => {
    if (isSlotBusy(time)) {
      return 'busy'
    }
    
    // Verificar se é muito próximo do horário atual
    if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      const [hours, minutes] = time.split(':').map(Number)
      const slotTime = new Date()
      slotTime.setHours(hours, minutes, 0, 0)
      
      if (!isAfter(slotTime, addMinutes(new Date(), 30))) {
        return 'unavailable'
      }
    }
    
    return 'available'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Agendar Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do restaurante */}
        {restaurantHours && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Horário de Funcionamento
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              {restaurantHours.opening_hours?.open || '09:00'} às {restaurantHours.opening_hours?.close || '22:00'}
            </p>
            {!restaurantHours.is_open && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  Restaurante fechado no momento
                </span>
              </div>
            )}
          </div>
        )}

        {/* Endereço de entrega */}
        {deliveryAddress && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Endereço de Entrega</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{deliveryAddress}</p>
          </div>
        )}

        {/* Seleção de data */}
        <div className="space-y-2">
          <Label>Selecione a Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Escolha uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  isBefore(date, startOfDay(new Date())) || 
                  isAfter(date, addMinutes(new Date(), 7 * 24 * 60)) // Máximo 7 dias no futuro
                }
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Seleção de horário */}
        {selectedDate && (
          <div className="space-y-2">
            <Label>Selecione o Horário</Label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {availableSlots.map((time) => {
                const status = getSlotStatus(time)
                const isSelected = selectedTime === time
                
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={status !== 'available' || loading}
                    onClick={() => setSelectedTime(time)}
                    className={`
                      ${isSelected ? 'bg-[#28a745] hover:bg-[#1e7e34]' : ''}
                      ${status === 'busy' ? 'opacity-50 cursor-not-allowed' : ''}
                      ${status === 'unavailable' ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    {time}
                    {status === 'busy' && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Ocupado
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
            
            {availableSlots.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Nenhum horário disponível para esta data</p>
              </div>
            )}
          </div>
        )}

        {/* Resumo e ações */}
        {selectedDate && selectedTime && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Resumo do Agendamento
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300">
              Data: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              Horário: {selectedTime}
            </p>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button
            onClick={handleScheduleConfirm}
            disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 bg-[#28a745] hover:bg-[#1e7e34]"
          >
            {loading ? 'Validando...' : 'Confirmar Agendamento'}
          </Button>
          
          {(selectedDate || selectedTime) && (
            <Button
              variant="outline"
              onClick={handleClearSchedule}
              disabled={loading}
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Agendamentos devem ser feitos com pelo menos 30 minutos de antecedência</p>
          <p>• Máximo de 7 dias no futuro</p>
          <p>• Sujeito à disponibilidade do restaurante e entregadores</p>
        </div>
      </CardContent>
    </Card>
  )
}