import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda para diferentes países
export function formatCurrency(amount: number, currency: string = 'AOA'): string {
  const currencyMap = {
    'AOA': { symbol: 'Kz', locale: 'pt-AO' },
    'MZN': { symbol: 'MT', locale: 'pt-MZ' },
    'CVE': { symbol: '$', locale: 'pt-CV' },
    'XOF': { symbol: 'CFA', locale: 'pt-GW' }
  }

  const config = currencyMap[currency as keyof typeof currencyMap] || currencyMap.AOA

  return `${amount.toLocaleString(config.locale)} ${config.symbol}`
}

// Formatação de tempo
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

// Cálculo de distância entre dois pontos
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Formatação de distância
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validação de telefone (formato internacional)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

// Geração de ID único
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Formatação de data
export function formatDate(date: string | Date, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Formatação de hora
export function formatDateTime(date: string | Date, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Verificar se restaurante está aberto
export function isRestaurantOpen(openingHours: any): boolean {
  const now = new Date()
  const currentDay = now.toLocaleLowerCase().substring(0, 3) // seg, ter, qua, etc.
  const currentTime = now.getHours() * 100 + now.getMinutes()

  const todayHours = openingHours[currentDay]
  if (!todayHours || todayHours.closed) {
    return false
  }

  const openTime = parseInt(todayHours.open.replace(':', ''))
  const closeTime = parseInt(todayHours.close.replace(':', ''))

  return currentTime >= openTime && currentTime <= closeTime
}

// Calcular taxa de entrega baseada na distância
export function calculateDeliveryFee(distance: number, baseFee: number = 500): number {
  if (distance <= 2) return baseFee
  if (distance <= 5) return baseFee + 200
  return baseFee + 500
}

// Obter cor do status do pedido
export function getOrderStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-600',
    confirmed: 'text-blue-600',
    preparing: 'text-orange-600',
    ready: 'text-purple-600',
    on_way: 'text-indigo-600',
    delivered: 'text-green-600',
    cancelled: 'text-red-600'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
}

// Obter ícone do método de pagamento
export function getPaymentMethodIcon(method: string): string {
  const icons = {
    card: '💳',
    cash: '💵',
    mpesa: '📱',
    emola: '📱',
    mvola: '📱',
    paypal: '🅿️'
  }
  return icons[method as keyof typeof icons] || '💳'
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Capitalizar primeira letra
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Converter para slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Verificar se é mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

// Obter coordenadas do usuário
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    })
  })
}