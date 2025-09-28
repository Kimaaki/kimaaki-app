// Constantes do aplicativo KIMAAKI

export const APP_CONFIG = {
  name: 'KIMAAKI',
  version: '1.0.0',
  description: 'Marketplace de entregas para Angola, Moçambique, Cabo Verde e Guiné-Bissau',
  supportEmail: 'suporte@kimaaki.com',
  supportPhone: '+244 900 000 000'
}

export const COUNTRIES = [
  {
    code: 'AO',
    name: 'Angola',
    currency: 'AOA',
    currencySymbol: 'Kz',
    flag: '🇦🇴',
    languages: ['pt'],
    phoneCode: '+244',
    cities: ['Luanda', 'Benguela', 'Huambo', 'Lobito', 'Cabinda']
  },
  {
    code: 'MZ',
    name: 'Moçambique',
    currency: 'MZN',
    currencySymbol: 'MT',
    flag: '🇲🇿',
    languages: ['pt'],
    phoneCode: '+258',
    cities: ['Maputo', 'Beira', 'Nampula', 'Matola', 'Quelimane']
  },
  {
    code: 'CV',
    name: 'Cabo Verde',
    currency: 'CVE',
    currencySymbol: '$',
    flag: '🇨🇻',
    languages: ['pt'],
    phoneCode: '+238',
    cities: ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Porto Novo']
  },
  {
    code: 'GW',
    name: 'Guiné-Bissau',
    currency: 'XOF',
    currencySymbol: 'CFA',
    flag: '🇬🇼',
    languages: ['pt'],
    phoneCode: '+245',
    cities: ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama']
  }
]

export const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Cartão de Crédito/Débito',
    icon: '💳',
    available: true,
    countries: ['AO', 'MZ', 'CV', 'GW']
  },
  {
    id: 'cash',
    name: 'Dinheiro na Entrega',
    icon: '💵',
    available: true,
    countries: ['AO', 'MZ', 'CV', 'GW']
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '📱',
    available: true,
    countries: ['MZ']
  },
  {
    id: 'emola',
    name: 'E-Mola',
    icon: '📱',
    available: true,
    countries: ['MZ']
  },
  {
    id: 'mvola',
    name: 'MVola',
    icon: '📱',
    available: true,
    countries: ['MZ']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    available: false,
    countries: ['AO', 'MZ', 'CV', 'GW']
  }
]

export const RESTAURANT_CATEGORIES = [
  {
    id: 'restaurant',
    name: 'Restaurantes',
    icon: '🍽️',
    color: '#FF6B35'
  },
  {
    id: 'fast_food',
    name: 'Fast Food',
    icon: '🍔',
    color: '#FF8C42'
  },
  {
    id: 'coffee',
    name: 'Café',
    icon: '☕',
    color: '#8B4513'
  },
  {
    id: 'dessert',
    name: 'Sobremesas',
    icon: '🍰',
    color: '#FF69B4'
  },
  {
    id: 'supermarket',
    name: 'Supermercados',
    icon: '🛒',
    color: '#4CAF50'
  },
  {
    id: 'pharmacy',
    name: 'Farmácias',
    icon: '💊',
    color: '#2196F3'
  },
  {
    id: 'bakery',
    name: 'Padarias',
    icon: '🥖',
    color: '#FF9800'
  }
]

export const ORDER_STATUSES = [
  {
    id: 'pending',
    name: 'Pendente',
    description: 'Aguardando confirmação',
    color: '#FFC107',
    icon: '⏳'
  },
  {
    id: 'confirmed',
    name: 'Confirmado',
    description: 'Pedido confirmado pelo restaurante',
    color: '#2196F3',
    icon: '✅'
  },
  {
    id: 'preparing',
    name: 'Preparando',
    description: 'Seu pedido está sendo preparado',
    color: '#FF9800',
    icon: '👨‍🍳'
  },
  {
    id: 'ready',
    name: 'Pronto',
    description: 'Pedido pronto para entrega',
    color: '#9C27B0',
    icon: '📦'
  },
  {
    id: 'on_way',
    name: 'A Caminho',
    description: 'Entregador a caminho',
    color: '#3F51B5',
    icon: '🚗'
  },
  {
    id: 'delivered',
    name: 'Entregue',
    description: 'Pedido entregue com sucesso',
    color: '#4CAF50',
    icon: '🎉'
  },
  {
    id: 'cancelled',
    name: 'Cancelado',
    description: 'Pedido cancelado',
    color: '#F44336',
    icon: '❌'
  }
]

export const DELIVERY_TIMES = [
  { min: 10, max: 20, label: '10-20 min' },
  { min: 15, max: 25, label: '15-25 min' },
  { min: 20, max: 30, label: '20-30 min' },
  { min: 25, max: 35, label: '25-35 min' },
  { min: 30, max: 45, label: '30-45 min' },
  { min: 45, max: 60, label: '45-60 min' }
]

export const CUISINES = [
  'Angolana',
  'Moçambicana',
  'Cabo-verdiana',
  'Portuguesa',
  'Brasileira',
  'Italiana',
  'Chinesa',
  'Indiana',
  'Árabe',
  'Francesa',
  'Americana',
  'Japonesa',
  'Mexicana',
  'Vegetariana',
  'Vegana'
]

export const ALLERGENS = [
  'Glúten',
  'Lactose',
  'Ovos',
  'Amendoim',
  'Nozes',
  'Peixe',
  'Crustáceos',
  'Soja',
  'Gergelim',
  'Mostarda',
  'Aipo',
  'Sulfitos'
]

export const RATING_LABELS = {
  1: 'Muito Ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente'
}

export const NOTIFICATION_TYPES = {
  order_update: {
    title: 'Atualização do Pedido',
    icon: '📦',
    color: '#2196F3'
  },
  promotion: {
    title: 'Promoção',
    icon: '🎉',
    color: '#FF6B35'
  },
  system: {
    title: 'Sistema',
    icon: '⚙️',
    color: '#9E9E9E'
  },
  driver_message: {
    title: 'Mensagem do Entregador',
    icon: '💬',
    color: '#4CAF50'
  }
}

export const DEFAULT_LOCATION = {
  lat: -8.8390,
  lng: 13.2894,
  address: 'Luanda, Angola'
}

export const MAP_STYLES = {
  default: [],
  dark: [
    {
      "elementType": "geometry",
      "stylers": [{"color": "#242f3e"}]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{"color": "#242f3e"}]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#746855"}]
    }
  ]
}

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh'
  },
  restaurants: {
    list: '/api/restaurants',
    details: '/api/restaurants/:id',
    menu: '/api/restaurants/:id/menu',
    search: '/api/restaurants/search'
  },
  orders: {
    create: '/api/orders',
    list: '/api/orders',
    details: '/api/orders/:id',
    track: '/api/orders/:id/track',
    cancel: '/api/orders/:id/cancel'
  },
  user: {
    profile: '/api/user/profile',
    addresses: '/api/user/addresses',
    favorites: '/api/user/favorites'
  }
}

export const STORAGE_KEYS = {
  user: 'kimaaki_user',
  cart: 'kimaaki_cart',
  location: 'kimaaki_location',
  language: 'kimaaki_language',
  theme: 'kimaaki_theme'
}

export const LIMITS = {
  maxCartItems: 50,
  maxAddresses: 10,
  maxOrderHistory: 100,
  searchQueryMinLength: 2,
  searchQueryMaxLength: 100
}