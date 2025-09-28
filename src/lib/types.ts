// Tipos para o aplicativo YAFOOD

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  addresses: Address[]
  preferences: UserPreferences
}

export interface Address {
  id: string
  label: string
  street: string
  city: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
  isDefault: boolean
}

export interface UserPreferences {
  language: 'pt' | 'en'
  notifications: boolean
  currency: 'AOA' | 'MZN' | 'CVE' | 'XOF'
}

export interface Restaurant {
  id: string
  name: string
  description?: string
  image: string
  logo?: string
  rating: number
  reviewCount: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder?: number
  category: RestaurantCategory
  cuisine?: string[]
  isOpen: boolean
  openingHours?: OpeningHours
  distance: string
  featured: boolean
  address: Address
  phone?: string
  promotions?: Promotion[]
}

export interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  restaurantId: string
  available: boolean
  options?: ProductOption[]
  nutritionalInfo?: NutritionalInfo
  allergens?: string[]
  tags?: string[]
}

export interface ProductOption {
  id: string
  name: string
  type: 'single' | 'multiple'
  required: boolean
  choices: ProductChoice[]
}

export interface ProductChoice {
  id: string
  name: string
  price: number
}

export interface NutritionalInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number
}

export interface CartItem extends Product {
  quantity: number
  selectedOptions?: SelectedOption[]
  specialInstructions?: string
}

export interface SelectedOption {
  optionId: string
  choiceIds: string[]
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  restaurant: Restaurant
  subtotal: number
  deliveryFee: number
  serviceFee: number
  discount: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryAddress: Address
  specialInstructions?: string
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  createdAt: string
  updatedAt: string
  driver?: Driver
  tracking?: OrderTracking[]
}

export interface Driver {
  id: string
  name: string
  avatar?: string
  rating: number
  phone: string
  vehicle: {
    type: 'motorcycle' | 'bicycle' | 'car'
    plate: string
  }
  location?: {
    lat: number
    lng: number
  }
}

export interface OrderTracking {
  status: OrderStatus
  timestamp: string
  message: string
  location?: {
    lat: number
    lng: number
  }
}

export interface Promotion {
  id: string
  title: string
  description: string
  type: 'percentage' | 'fixed' | 'free_delivery'
  value: number
  minOrder?: number
  validUntil: string
  code?: string
}

export interface Review {
  id: string
  userId: string
  orderId: string
  restaurantId?: string
  driverId?: string
  rating: number
  comment?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
  data?: any
}

// Enums
export type RestaurantCategory = 'restaurant' | 'supermarket' | 'pharmacy' | 'bakery' | 'coffee' | 'fast_food' | 'dessert'

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_way' | 'delivered' | 'cancelled'

export type PaymentMethod = 'card' | 'cash' | 'mpesa' | 'emola' | 'mvola' | 'paypal'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type NotificationType = 'order_update' | 'promotion' | 'system' | 'driver_message'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Search and Filter types
export interface SearchFilters {
  query?: string
  category?: RestaurantCategory
  cuisine?: string[]
  rating?: number
  deliveryFee?: 'free' | 'paid'
  deliveryTime?: number
  sortBy?: 'distance' | 'rating' | 'delivery_time' | 'delivery_fee'
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

// Location types
export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface Country {
  code: string
  name: string
  currency: string
  flag: string
  languages: string[]
}