"use client"

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Clock, Plus, Minus, ShoppingCart, User, Heart, Filter, Phone, Mail, CreditCard, Truck, CheckCircle, X, MessageCircle, Navigation, ChevronLeft, ChevronRight, Settings, Sun, Moon, Crown, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useTheme } from 'next-themes'
import { theme, customClasses } from '@/styles/theme'

// Componentes das funcionalidades
import { DeliveryTracking } from '@/components/tracking/DeliveryTracking'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { RatingSystem } from '@/components/ratings/RatingSystem'
import { OrderNotifications, useOrderStatusSimulator } from '@/components/notifications/OrderNotifications'
import { UserProfile } from '@/components/profile/UserProfile'
import { CouponSystem, useCouponDiscount } from '@/components/coupons/CouponSystem'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { UserStatusBanner } from '@/components/auth/UserStatusBanner'
import { RestaurantManagement } from '@/components/restaurant/RestaurantManagement'
import { DeliveryScheduling } from '@/components/delivery/DeliveryScheduling'
import { SocialAuth, useAuth } from '@/components/auth/SocialAuth'
import { UserRegistration } from '@/components/auth/UserRegistration'
import { CompanyRegistration } from '@/components/company/CompanyRegistration'
import { DeliveryRegistration } from '@/components/delivery/DeliveryRegistration'
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer'
import { PlanComparison } from '@/components/plans/PlanComparison'
import { supabase, type Coupon } from '@/lib/supabase'

// Tipos de dados
interface Restaurant {
  id: string
  name: string
  image: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  category: string
  isOpen: boolean
  distance: string
  featured: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  restaurantId: string
}

interface CartItem extends Product {
  quantity: number
}

interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_way' | 'delivered'
  restaurant: string
  date: string
  deliveryAddress: string
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed'
  driverId?: string
  driverName?: string
  scheduledDelivery?: Date
}

interface Banner {
  id: string
  title: string
  subtitle: string
  image: string
  backgroundColor: string
  textColor: string
}

// Componente do Carrossel de Banners
const BannerCarousel = () => {
  const [currentBanner, setCurrentBanner] = useState(0)

  const banners: Banner[] = [
    {
      id: '1',
      title: 'Tudo o que você precisa,',
      subtitle: 'entregue até à sua porta.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop',
      backgroundColor: 'linear-gradient(135deg, #28a745 0%, #ffc107 100%)',
      textColor: 'white'
    },
    {
      id: '2',
      title: 'Peça online, acompanhe em tempo real',
      subtitle: 'e receba sem complicação.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
      backgroundColor: 'linear-gradient(135deg, #ffc107 0%, #28a745 100%)',
      textColor: 'white'
    },
    {
      id: '3',
      title: 'Supermercados e farmácias',
      subtitle: 'na palma da sua mão.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
      backgroundColor: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      textColor: 'white'
    },
    {
      id: '4',
      title: 'Entregadores dedicados',
      subtitle: 'para sua comodidade.',
      image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&h=200&fit=crop',
      backgroundColor: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
      textColor: 'white'
    }
  ]

  // Auto-play do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToBanner = (index: number) => {
    setCurrentBanner(index)
  }

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg mb-6">
      {/* Banners */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentBanner * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="w-full h-full flex-shrink-0 relative"
            style={{ background: banner.backgroundColor }}
          >
            <div className="absolute inset-0 flex items-center justify-between p-6">
              <div className="flex-1 z-10">
                <h2 className={`text-xl font-bold mb-2 text-${banner.textColor}`}>
                  {banner.title}
                </h2>
                <p className={`text-sm text-${banner.textColor}/90`}>
                  {banner.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  className="w-24 h-24 object-cover rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setas de navegação */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full w-8 h-8 p-0 transition-all duration-300"
        onClick={prevBanner}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full w-8 h-8 p-0 transition-all duration-300"
        onClick={nextBanner}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Pontos de navegação */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentBanner 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            onClick={() => goToBanner(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default function KimaakiApp() {
  const { theme: currentTheme, setTheme } = useTheme()
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth()
  
  const [currentView, setCurrentView] = useState<'home' | 'restaurant' | 'cart' | 'orders' | 'profile' | 'tracking' | 'payment' | 'chat-support' | 'chat-delivery' | 'ratings' | 'admin' | 'user-management' | 'restaurant-management' | 'theme-settings' | 'register' | 'company-register' | 'delivery-register' | 'plans'>('home')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentLocation, setCurrentLocation] = useState('Luanda, Angola')
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')
  const [showLogin, setShowLogin] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showCompanyRegistration, setShowCompanyRegistration] = useState(false)
  const [showDeliveryRegistration, setShowDeliveryRegistration] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [trackingProgress, setTrackingProgress] = useState(25)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('user-123') // Simulado
  const [ratingTarget, setRatingTarget] = useState<{id: string, type: 'restaurant' | 'order' | 'driver', name: string} | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [scheduledDelivery, setScheduledDelivery] = useState<Date | null>(null)
  const [isAdmin, setIsAdmin] = useState(false) // Simulado - em produção, verificar roles do usuário

  // Hook para simulação de status de pedido
  const { simulateOrderProgress } = useOrderStatusSimulator()

  // Hook para calcular desconto do cupom
  const { discount, freeShipping } = useCouponDiscount(appliedCoupon, getCartTotal(), 500)

  // Textos multilíngues
  const texts = {
    pt: {
      appName: 'KIMAAKI',
      tagline: 'Entrega rápida na sua porta',
      searchPlaceholder: 'Buscar restaurantes, pratos...',
      location: 'Localização',
      categories: {
        all: 'Todos',
        restaurant: 'Restaurantes',
        supermarket: 'Supermercados',
        pharmacy: 'Farmácias',
        bakery: 'Padarias'
      },
      featured: 'Em Destaque',
      nearYou: 'Perto de Você',
      rating: 'Avaliação',
      deliveryTime: 'Tempo de entrega',
      deliveryFee: 'Taxa de entrega',
      free: 'Grátis',
      closed: 'Fechado',
      open: 'Aberto',
      addToCart: 'Adicionar ao Carrinho',
      cart: 'Carrinho',
      checkout: 'Finalizar Pedido',
      total: 'Total',
      login: 'Entrar',
      register: 'Cadastrar',
      email: 'Email',
      phone: 'Telefone',
      password: 'Senha',
      orders: 'Pedidos',
      profile: 'Perfil',
      paymentMethods: 'Métodos de Pagamento',
      cardPayment: 'Cartão de Crédito/Débito',
      payOnDelivery: 'Pagar na Entrega',
      mPesa: 'M-Pesa',
      eMola: 'E-Mola',
      mVola: 'MVola',
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      on_way: 'A Caminho',
      delivered: 'Entregue',
      trackOrder: 'Rastrear Pedido',
      orderHistory: 'Histórico de Pedidos',
      rateOrder: 'Avaliar Pedido',
      rateRestaurant: 'Avaliar Restaurante',
      rateDriver: 'Avaliar Entregador',
      support: 'Suporte',
      chatWithDriver: 'Chat com Entregador',
      payWithStripe: 'Pagar com Cartão',
      viewRatings: 'Ver Avaliações',
      admin: 'Administração',
      themeSettings: 'Tema',
      plans: 'Planos e Comissões'
    },
    en: {
      appName: 'KIMAAKI',
      tagline: 'Fast delivery at your door',
      searchPlaceholder: 'Search restaurants, dishes...',
      location: 'Location',
      categories: {
        all: 'All',
        restaurant: 'Restaurants',
        supermarket: 'Supermarkets',
        pharmacy: 'Pharmacies',
        bakery: 'Bakeries'
      },
      featured: 'Featured',
      nearYou: 'Near You',
      rating: 'Rating',
      deliveryTime: 'Delivery time',
      deliveryFee: 'Delivery fee',
      free: 'Free',
      closed: 'Closed',
      open: 'Open',
      addToCart: 'Add to Cart',
      cart: 'Cart',
      checkout: 'Checkout',
      total: 'Total',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      orders: 'Orders',
      profile: 'Profile',
      paymentMethods: 'Payment Methods',
      cardPayment: 'Credit/Debit Card',
      payOnDelivery: 'Pay on Delivery',
      mPesa: 'M-Pesa',
      eMola: 'E-Mola',
      mVola: 'MVola',
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      on_way: 'On the Way',
      delivered: 'Delivered',
      trackOrder: 'Track Order',
      orderHistory: 'Order History',
      rateOrder: 'Rate Order',
      rateRestaurant: 'Rate Restaurant',
      rateDriver: 'Rate Driver',
      support: 'Support',
      chatWithDriver: 'Chat with Driver',
      payWithStripe: 'Pay with Card',
      viewRatings: 'View Ratings',
      admin: 'Administration',
      themeSettings: 'Theme',
      plans: 'Plans & Commissions'
    }
  }

  const t = texts[language]

  // Dados de exemplo
  const restaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Restaurante Luanda',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      rating: 4.5,
      deliveryTime: '25-35 min',
      deliveryFee: 500,
      category: 'restaurant',
      isOpen: true,
      distance: '1.2 km',
      featured: true
    },
    {
      id: '2',
      name: 'Supermercado Central',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      rating: 4.2,
      deliveryTime: '15-25 min',
      deliveryFee: 0,
      category: 'supermarket',
      isOpen: true,
      distance: '0.8 km',
      featured: false
    },
    {
      id: '3',
      name: 'Padaria Maputo',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      rating: 4.7,
      deliveryTime: '10-20 min',
      deliveryFee: 200,
      category: 'bakery',
      isOpen: true,
      distance: '0.5 km',
      featured: true
    },
    {
      id: '4',
      name: 'Farmácia Praia',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      rating: 4.3,
      deliveryTime: '20-30 min',
      deliveryFee: 300,
      category: 'pharmacy',
      isOpen: false,
      distance: '2.1 km',
      featured: false
    }
  ]

  const products: Product[] = [
    {
      id: '1',
      name: 'Muamba de Galinha',
      description: 'Prato tradicional angolano com galinha, quiabo e dendê',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
      category: 'main',
      restaurantId: '1'
    },
    {
      id: '2',
      name: 'Calulu de Peixe',
      description: 'Peixe fresco com vegetais e temperos locais',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
      category: 'main',
      restaurantId: '1'
    },
    {
      id: '3',
      name: 'Pão Fresco',
      description: 'Pão artesanal feito na hora',
      price: 150,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop',
      category: 'bakery',
      restaurantId: '3'
    }
  ]

  const orders: Order[] = [
    {
      id: '1',
      items: [
        { ...products[0], quantity: 1 },
        { ...products[1], quantity: 1 }
      ],
      total: 5500,
      status: 'delivered',
      restaurant: 'Restaurante Luanda',
      date: '2024-01-15',
      deliveryAddress: 'Rua da Missão, Luanda',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      driverId: 'driver-123',
      driverName: 'João Silva'
    }
  ]

  // Funções
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getOrderTotal = () => {
    const subtotal = getCartTotal()
    const deliveryFee = freeShipping ? 0 : 500
    return subtotal + deliveryFee - discount
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || restaurant.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Simulação de rastreamento em tempo real
  useEffect(() => {
    if (currentOrder && currentOrder.status !== 'delivered') {
      const interval = setInterval(() => {
        setTrackingProgress(prev => {
          if (prev >= 100) return 100
          return prev + 5
        })
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [currentOrder])

  // Handlers para pagamento
  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Pagamento realizado com sucesso:', paymentIntentId)
    
    // Criar pedido
    const newOrder: Order = {
      id: Date.now().toString(),
      items: cart,
      total: getOrderTotal(),
      status: 'confirmed',
      restaurant: selectedRestaurant?.name || 'Restaurante',
      date: new Date().toISOString().split('T')[0],
      deliveryAddress: 'Rua da Missão, Luanda',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      driverId: 'driver-123',
      driverName: 'João Silva',
      scheduledDelivery: scheduledDelivery || undefined
    }
    
    setCurrentOrder(newOrder)
    setCart([])
    setAppliedCoupon(null)
    setScheduledDelivery(null)
    setShowPaymentDialog(false)
    setCurrentView('tracking')

    // Simular progresso do pedido com notificações em tempo real
    simulateOrderProgress(newOrder.id, currentUserId, newOrder.restaurant)
  }

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error)
    alert('Erro no pagamento: ' + error)
  }

  // Handler para clique em notificação
  const handleNotificationClick = (notification: any) => {
    // Navegar para a tela de rastreamento do pedido
    if (notification.orderId && currentOrder?.id === notification.orderId) {
      setCurrentView('tracking')
    }
  }

  // Handler para autenticação
  const handleAuthSuccess = (userData: any) => {
    setCurrentUserId(userData.id)
    setShowLogin(false)
  }

  // Handler para cadastro com sucesso
  const handleRegistrationSuccess = (userData: any) => {
    setCurrentUserId(userData.id)
    setShowRegistration(false)
    setShowLogin(false)
  }

  // Handler para cadastro de empresa com sucesso
  const handleCompanyRegistrationSuccess = (companyData: any) => {
    setShowCompanyRegistration(false)
    setCurrentView('home')
  }

  // Handler para cadastro de entregador com sucesso
  const handleDeliveryRegistrationSuccess = (deliveryData: any) => {
    setShowDeliveryRegistration(false)
    setCurrentView('home')
  }

  // Componente de Login
  const LoginDialog = () => (
    <Dialog open={showLogin} onOpenChange={setShowLogin}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Entrar ou Cadastrar</DialogTitle>
        </DialogHeader>
        <SocialAuth
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowLogin(false)}
        />
      </DialogContent>
    </Dialog>
  )

  // Componente de Rastreamento
  const TrackingView = () => (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentView('orders')} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
          <X className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.trackOrder}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
            onClick={() => setCurrentView('chat-support')}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
            onClick={() => setCurrentView('chat-delivery')}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {currentOrder && (
        <DeliveryTracking
          orderId={currentOrder.id}
          customerLocation={{ lat: -8.8383, lng: 13.2344 }}
          restaurantLocation={{ lat: -8.8300, lng: 13.2280 }}
          onContactDriver={() => setCurrentView('chat-delivery')}
        />
      )}

      {/* Botão para avaliar após entrega */}
      {currentOrder && currentOrder.status === 'delivered' && (
        <div className="space-y-3">
          <Card className={customClasses.cardRegular}>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Pedido entregue! Como foi sua experiência?</h3>
              <div className="space-y-2">
                <Button 
                  className={customClasses.btnSecondary + " w-full"}
                  onClick={() => {
                    setRatingTarget({
                      id: currentOrder.id,
                      type: 'order',
                      name: `Pedido #${currentOrder.id.slice(-4)}`
                    })
                    setCurrentView('ratings')
                  }}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {t.rateOrder}
                </Button>
                <Button 
                  className={customClasses.btnSecondary + " w-full"}
                  onClick={() => {
                    setRatingTarget({
                      id: '1',
                      type: 'restaurant',
                      name: currentOrder.restaurant
                    })
                    setCurrentView('ratings')
                  }}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {t.rateRestaurant}
                </Button>
                {currentOrder.driverId && (
                  <Button 
                    className={customClasses.btnSecondary + " w-full"}
                    onClick={() => {
                      setRatingTarget({
                        id: currentOrder.driverId!,
                        type: 'driver',
                        name: currentOrder.driverName || 'Entregador'
                      })
                      setCurrentView('ratings')
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {t.rateDriver}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  // Componente principal baseado na view atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'plans':
        return (
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setCurrentView('home')}>
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.plans}</h1>
              <div></div>
            </div>
            <PlanComparison />
          </div>
        )

      case 'register':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setCurrentView('home')}>
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cadastro KIMAAKI</h1>
              <div></div>
            </div>
            <UserRegistration
              isOpen={true}
              onClose={() => setCurrentView('home')}
              onSuccess={handleRegistrationSuccess}
            />
          </div>
        )

      case 'company-register':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setCurrentView('home')}>
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cadastro de Empresa</h1>
              <div></div>
            </div>
            <CompanyRegistration
              isOpen={true}
              onClose={() => setCurrentView('home')}
              onSuccess={handleCompanyRegistrationSuccess}
            />
          </div>
        )

      case 'delivery-register':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setCurrentView('home')}>
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cadastro de Entregador</h1>
              <div></div>
            </div>
            <DeliveryRegistration
              isOpen={true}
              onClose={() => setCurrentView('home')}
              onSuccess={handleDeliveryRegistrationSuccess}
            />
          </div>
        )

      case 'theme-settings':
        return (
          <div className="max-w-4xl mx-auto p-4">
            <ThemeCustomizer onClose={() => setCurrentView('home')} />
          </div>
        )

      case 'admin':
        return (
          <AdminPanel onClose={() => setCurrentView('home')} />
        )

      case 'restaurant-management':
        return selectedRestaurant ? (
          <RestaurantManagement 
            restaurantId={selectedRestaurant.id}
            onClose={() => setCurrentView('home')}
          />
        ) : null

      case 'ratings':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setCurrentView('tracking')}>
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Avaliações</h1>
              <div></div>
            </div>
            {ratingTarget && (
              <RatingSystem
                targetId={ratingTarget.id}
                targetType={ratingTarget.type}
                targetName={ratingTarget.name}
                currentUserId={currentUserId}
                showAddRating={true}
              />
            )}
          </div>
        )

      case 'chat-support':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.support}</h1>
              <Button variant="ghost" onClick={() => setCurrentView('tracking')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ChatInterface
              roomId="support-123"
              userId="user-123"
              userName="João Domingos"
              chatType="support"
              onClose={() => setCurrentView('tracking')}
            />
          </div>
        )

      case 'chat-delivery':
        return (
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.chatWithDriver}</h1>
              <Button variant="ghost" onClick={() => setCurrentView('tracking')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ChatInterface
              roomId="delivery-123"
              userId="user-123"
              userName="João Domingos"
              chatType="delivery"
              orderId={currentOrder?.id}
              onClose={() => setCurrentView('tracking')}
            />
          </div>
        )

      case 'payment':
        return (
          <div className="max-w-md mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pagamento</h1>
              <Button variant="ghost" onClick={() => setCurrentView('cart')}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Sistema de pagamento em desenvolvimento</p>
            </div>
          </div>
        )

      case 'restaurant':
        return (
          <div className="max-w-md mx-auto">
            {selectedRestaurant && (
              <>
                <div className="relative">
                  <img 
                    src={selectedRestaurant.image} 
                    alt={selectedRestaurant.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button 
                    variant="ghost" 
                    className="absolute top-4 left-4 bg-white/80 hover:bg-white transition-all duration-300"
                    onClick={() => setCurrentView('home')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      className="absolute top-4 right-4 bg-white/80 hover:bg-white transition-all duration-300"
                      onClick={() => setCurrentView('restaurant-management')}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedRestaurant.name}</h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {selectedRestaurant.rating}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {selectedRestaurant.deliveryTime}
                        </div>
                        <div className="flex items-center">
                          <Truck className="w-4 h-4 mr-1" />
                          {selectedRestaurant.deliveryFee === 0 ? t.free : `${selectedRestaurant.deliveryFee} Kz`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                      onClick={() => {
                        setRatingTarget({
                          id: selectedRestaurant.id,
                          type: 'restaurant',
                          name: selectedRestaurant.name
                        })
                        setCurrentView('ratings')
                      }}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {t.viewRatings}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {products
                      .filter(product => product.restaurantId === selectedRestaurant.id)
                      .map(product => (
                        <Card key={product.id} className={customClasses.cardRegular}>
                          <CardContent className="p-4">
                            <div className="flex space-x-4">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-900 dark:text-gray-100">{product.price.toLocaleString()} Kz</span>
                                  <Button 
                                    size="sm"
                                    className={customClasses.btnPrimary}
                                    onClick={() => addToCart(product)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t.addToCart}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 'cart':
        return (
          <div className="max-w-md mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.cart}</h1>
              <Button variant="ghost" onClick={() => setCurrentView('home')} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <Card key={item.id} className={customClasses.cardRegular}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.price.toLocaleString()} Kz</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white transition-all duration-300 active:scale-95"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center text-gray-900 dark:text-gray-100">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white transition-all duration-300 active:scale-95"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sistema de Cupons */}
                <CouponSystem
                  onCouponApplied={setAppliedCoupon}
                  orderTotal={getCartTotal()}
                  appliedCoupon={appliedCoupon}
                />

                {/* Agendamento de Entrega */}
                <DeliveryScheduling
                  onScheduleSelected={setScheduledDelivery}
                  restaurantId={selectedRestaurant?.id}
                  deliveryAddress="Rua da Missão, Luanda"
                />

                <Card className={customClasses.cardRegular}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-gray-100">Subtotal</span>
                        <span className="text-gray-900 dark:text-gray-100">{getCartTotal().toLocaleString()} Kz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-gray-100">Taxa de entrega</span>
                        <span className={`${freeShipping ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          500 Kz
                        </span>
                        {freeShipping && (
                          <span className="text-green-600 font-medium">Grátis</span>
                        )}
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto</span>
                          <span>-{discount.toLocaleString()} Kz</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-gray-100">{t.total}</span>
                        <span className="text-gray-900 dark:text-gray-100">{getOrderTotal().toLocaleString()} Kz</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Endereço de entrega</Label>
                    <Textarea placeholder="Digite seu endereço completo..." className={customClasses.inputPrimary} />
                  </div>
                  
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">{t.paymentMethods}</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger className={customClasses.inputPrimary}>
                        <SelectValue placeholder="Selecione o método de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t.payOnDelivery}</SelectItem>
                        <SelectItem value="mpesa">{t.mPesa}</SelectItem>
                        <SelectItem value="emola">{t.eMola}</SelectItem>
                        <SelectItem value="mvola">{t.mVola}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className={customClasses.btnPrimary + " w-full text-lg py-3"}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowLogin(true)
                    } else {
                      // Simular pedido
                      const newOrder: Order = {
                        id: Date.now().toString(),
                        items: cart,
                        total: getOrderTotal(),
                        status: 'confirmed',
                        restaurant: 'Restaurante Luanda',
                        date: new Date().toISOString().split('T')[0],
                        deliveryAddress: 'Rua da Missão, Luanda',
                        paymentMethod: selectedPaymentMethod,
                        paymentStatus: 'pending',
                        driverId: 'driver-123',
                        driverName: 'João Silva',
                        scheduledDelivery: scheduledDelivery || undefined
                      }
                      setCurrentOrder(newOrder)
                      setCart([])
                      setAppliedCoupon(null)
                      setScheduledDelivery(null)
                      setCurrentView('tracking')

                      // Simular progresso do pedido com notificações
                      simulateOrderProgress(newOrder.id, currentUserId, newOrder.restaurant)
                    }
                  }}
                  disabled={!selectedPaymentMethod}
                >
                  {t.checkout} • {getOrderTotal().toLocaleString()} Kz
                </Button>
              </>
            )}
          </div>
        )

      case 'orders':
        return (
          <div className="max-w-md mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.orderHistory}</h1>
              <Button variant="ghost" onClick={() => setCurrentView('home')} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className={customClasses.cardRegular}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.restaurant}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.date}</p>
                      </div>
                      <Badge className={order.status === 'delivered' ? customClasses.badgeSuccess : customClasses.badgeSecondary}>
                        {t[order.status]}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, index) => (
                        <p key={index} className="text-sm text-gray-900 dark:text-gray-100">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{order.total.toLocaleString()} Kz</span>
                      <div className="space-x-2">
                        {order.status !== 'delivered' && (
                          <Button 
                            size="sm" 
                            className={customClasses.btnSecondary}
                            onClick={() => {
                              setCurrentOrder(order)
                              setCurrentView('tracking')
                            }}
                          >
                            {t.trackOrder}
                          </Button>
                        )}
                        {order.status === 'delivered' && (
                          <Button 
                            size="sm" 
                            className={customClasses.btnSecondary}
                            onClick={() => {
                              setRatingTarget({
                                id: order.id,
                                type: 'order',
                                name: `Pedido #${order.id.slice(-4)}`
                              })
                              setCurrentView('ratings')
                            }}
                          >
                            {t.rateOrder}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'profile':
        return isAuthenticated ? (
          <UserProfile 
            userId={currentUserId}
            onClose={() => setCurrentView('home')}
          />
        ) : (
          <div className="max-w-md mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.profile}</h1>
              <Button variant="ghost" onClick={() => setCurrentView('home')} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center py-8">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Faça login para acessar seu perfil</p>
              <div className="space-y-3">
                <Button onClick={() => setShowLogin(true)} className={customClasses.btnPrimary + " w-full"}>
                  {t.login}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('register')} 
                  className="w-full border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                >
                  Cadastrar como Cliente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('delivery-register')} 
                  className="w-full border-[#ffc107] text-[#ffc107] hover:bg-[#ffc107] hover:text-white"
                >
                  Cadastrar como Entregador
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('company-register')} 
                  className="w-full border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white"
                >
                  Cadastrar Empresa (Restaurante, Supermercado, Farmácia)
                </Button>
              </div>
            </div>
          </div>
        )

      case 'tracking':
        return <TrackingView />

      default:
        return (
          <div className="max-w-md mx-auto space-y-6">
            {/* Header com gradiente verde */}
            <div className={`${customClasses.headerGradient} p-6 rounded-b-3xl shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{t.appName}</h1>
                  <p className="text-white/90 text-sm">{t.tagline}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20 transition-all duration-300"
                    onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                  >
                    {language === 'pt' ? 'EN' : 'PT'}
                  </Button>

                  {/* Botão de tema */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20 transition-all duration-300"
                    onClick={() => setCurrentView('theme-settings')}
                  >
                    {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>

                  {/* Botão admin (se for admin) */}
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20 transition-all duration-300"
                      onClick={() => setCurrentView('admin')}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Notificações de Pedidos */}
                  {isAuthenticated && (
                    <OrderNotifications
                      userId={currentUserId}
                      onNotificationClick={handleNotificationClick}
                    />
                  )}
                  
                  {!isAuthenticated ? (
                    <div className="flex space-x-2">
                      <Button 
                        className="bg-white text-[#28a745] hover:bg-white/90 font-medium transition-all duration-300 hover:scale-105"
                        size="sm" 
                        onClick={() => setShowLogin(true)}
                      >
                        {t.login}
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-white text-white hover:bg-white hover:text-[#28a745] font-medium transition-all duration-300 hover:scale-105"
                        size="sm" 
                        onClick={() => setCurrentView('register')}
                      >
                        {t.register}
                      </Button>
                    </div>
                  ) : (
                    <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all duration-300" onClick={() => setCurrentView('profile')}>
                      <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
                      <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 text-sm text-white/90 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{currentLocation}</span>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 transition-all duration-300">Alterar</Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder={t.searchPlaceholder}
                  className="pl-10 bg-white border-0 shadow-md focus:ring-2 focus:ring-white/30 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 transition-all duration-300">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="px-4 space-y-6">
              {/* Banner de Status do Usuário */}
              {isAuthenticated && user && (
                <UserStatusBanner
                  userId={user.id}
                  userRole={user.role}
                  userStatus={user.status}
                />
              )}

              {/* Carrossel de Banners */}
              <BannerCarousel />

              {/* Seção de Planos para Empresas */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Planos para Empresas</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Descubra nossos planos de comissão</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                      onClick={() => setCurrentView('plans')}
                    >
                      Ver Planos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {Object.entries(t.categories).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    className={`whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === key 
                        ? 'bg-[#28a745] text-white hover:bg-[#1e7e34] shadow-md' 
                        : 'border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white dark:border-[#28a745] dark:text-[#28a745]'
                    }`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Featured Restaurants */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-gradient-to-r from-[#28a745] to-[#1e7e34] bg-clip-text text-transparent">{t.featured}</span>
                  <div className="ml-2 w-8 h-0.5 bg-gradient-to-r from-[#28a745] to-[#1e7e34]"></div>
                </h2>
                <div className="grid gap-4">
                  {filteredRestaurants
                    .filter(restaurant => restaurant.featured)
                    .map(restaurant => (
                      <Card 
                        key={restaurant.id} 
                        className={`${customClasses.cardFeatured} cursor-pointer`}
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setCurrentView('restaurant')
                        }}
                      >
                        <div className="relative">
                          <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-40 object-cover rounded-t-2xl"
                          />
                          {!restaurant.isOpen && (
                            <div className="absolute inset-0 bg-black/50 rounded-t-2xl flex items-center justify-center">
                              <Badge className="bg-white/90 text-gray-800">{t.closed}</Badge>
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-3 right-3 bg-white/80 hover:bg-white transition-all duration-300 hover:scale-110"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{restaurant.name}</h3>
                            <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm font-medium">{restaurant.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {restaurant.deliveryTime}
                              </div>
                              <div className="flex items-center">
                                <Truck className="w-4 h-4 mr-1" />
                                {restaurant.deliveryFee === 0 ? (
                                  <span className="text-[#28a745] font-medium">{t.free}</span>
                                ) : (
                                  `${restaurant.deliveryFee} Kz`
                                )}
                              </div>
                            </div>
                            <span className="font-medium">{restaurant.distance}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Near You */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t.nearYou}</h2>
                <div className="grid gap-3">
                  {filteredRestaurants
                    .filter(restaurant => !restaurant.featured)
                    .map(restaurant => (
                      <Card 
                        key={restaurant.id} 
                        className={`${customClasses.cardRegular} cursor-pointer`}
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setCurrentView('restaurant')
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            <div className="relative">
                              <img 
                                src={restaurant.image} 
                                alt={restaurant.name}
                                className="w-16 h-16 object-cover rounded-xl"
                              />
                              {!restaurant.isOpen && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">{t.closed}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">{restaurant.name}</h3>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span className="text-sm">{restaurant.rating}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {restaurant.deliveryTime}
                                  </div>
                                  <div className="flex items-center">
                                    <Truck className="w-4 h-4 mr-1" />
                                    {restaurant.deliveryFee === 0 ? (
                                      <span className="text-[#28a745] font-medium">{t.free}</span>
                                    ) : (
                                      `${restaurant.deliveryFee} Kz`
                                    )}
                                  </div>
                                </div>
                                <span>{restaurant.distance}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>

            {/* Espaçamento para navbar */}
            <div className="h-20"></div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {renderCurrentView()}
      
      {/* Bottom Navigation */}
      {currentView === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <Button 
              variant="ghost" 
              className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${ 
                currentView === 'home' ? customClasses.navItemActive : customClasses.navItemInactive
              }`}
              onClick={() => setCurrentView('home')}
            >
              <Search className={`w-5 h-5 mb-1 ${currentView === 'home' ? 'text-[#28a745]' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className="text-xs">Início</span>
            </Button>
            <Button 
              variant="ghost" 
              className={`flex-1 flex flex-col items-center py-2 relative transition-all duration-300 hover:scale-105 ${customClasses.navItemInactive}`}
              onClick={() => setCurrentView('cart')}
            >
              <ShoppingCart className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
              <span className="text-xs">{t.cart}</span>
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#28a745] text-white animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 hover:scale-105 ${customClasses.navItemInactive}`}
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLogin(true)
                } else {
                  setCurrentView('orders')
                }
              }}
            >
              <Clock className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
              <span className="text-xs">{t.orders}</span>
            </Button>
            <Button 
              variant="ghost" 
              className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 hover:scale-105 ${customClasses.navItemInactive}`}
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLogin(true)
                } else {
                  setCurrentView('profile')
                }
              }}
            >
              <User className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
              <span className="text-xs">{t.profile}</span>
            </Button>
          </div>
        </div>
      )}

      <LoginDialog />

      {/* Modal de Cadastro com Roles */}
      <UserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Modal de Cadastro de Empresa */}
      <CompanyRegistration
        isOpen={showCompanyRegistration}
        onClose={() => setShowCompanyRegistration(false)}
        onSuccess={handleCompanyRegistrationSuccess}
      />

      {/* Modal de Cadastro de Entregador */}
      <DeliveryRegistration
        isOpen={showDeliveryRegistration}
        onClose={() => setShowDeliveryRegistration(false)}
        onSuccess={handleDeliveryRegistrationSuccess}
      />
    </div>
  )
}