"use client"

import { useState, useEffect } from 'react'
import { supabase, type Restaurant, type Order, type Driver } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Store, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Search,
  Filter,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminDashboardProps {
  onClose: () => void
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalOrders: 0,
    totalDrivers: 0,
    totalRevenue: 0,
    todayOrders: 0,
    activeDrivers: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Carregar restaurantes
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      // Carregar pedidos
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            image_url
          ),
          user_profiles (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      // Carregar entregadores
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (restaurantsData) setRestaurants(restaurantsData)
      if (ordersData) setOrders(ordersData)
      if (driversData) setDrivers(driversData)

      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = ordersData?.filter(order => 
        order.created_at.startsWith(today)
      ).length || 0

      const totalRevenue = ordersData?.reduce((sum, order) => 
        sum + (order.status === 'delivered' ? order.total : 0), 0
      ) || 0

      const activeDrivers = driversData?.filter(driver => driver.is_available).length || 0

      setStats({
        totalRestaurants: restaurantsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalDrivers: driversData?.length || 0,
        totalRevenue,
        todayOrders,
        activeDrivers
      })

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Status do pedido atualizado!')
      loadDashboardData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do pedido')
    }
  }

  const toggleRestaurantStatus = async (restaurantId: string, isOpen: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          is_open: !isOpen,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)

      if (error) throw error

      toast.success(`Restaurante ${!isOpen ? 'aberto' : 'fechado'} com sucesso!`)
      loadDashboardData()
    } catch (error) {
      console.error('Erro ao alterar status do restaurante:', error)
      toast.error('Erro ao alterar status do restaurante')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'on_way':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      on_way: 'A Caminho',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return statusMap[status] || status
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurants?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Administrativo</h1>
        <Button variant="ghost" onClick={onClose}>
          ✕
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Restaurantes
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Entregadores
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total de Restaurantes
                    </p>
                    <p className="text-2xl font-bold">{stats.totalRestaurants}</p>
                  </div>
                  <Store className="w-8 h-8 text-[#28a745]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pedidos Hoje
                    </p>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                  </div>
                  <Package className="w-8 h-8 text-[#28a745]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Entregadores Ativos
                    </p>
                    <p className="text-2xl font-bold">{stats.activeDrivers}</p>
                  </div>
                  <Users className="w-8 h-8 text-[#28a745]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Receita Total
                    </p>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} Kz</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#28a745]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de pedidos recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold">#{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">{order.restaurants?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      <p className="font-semibold">{order.total.toLocaleString()} Kz</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restaurantes */}
        <TabsContent value="restaurants" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gestão de Restaurantes</h3>
            <Button className="bg-[#28a745] hover:bg-[#1e7e34]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Restaurante
            </Button>
          </div>

          <div className="grid gap-4">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-semibold text-lg">{restaurant.name}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{restaurant.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {restaurant.is_open ? 'Aberto' : 'Fechado'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ⭐ {restaurant.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Taxa: {restaurant.delivery_fee.toLocaleString()} Kz
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_open)}
                      >
                        {restaurant.is_open ? 'Fechar' : 'Abrir'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pedidos */}
        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gestão de Pedidos</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="on_way">A Caminho</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Pedido #{order.id.slice(-8)}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600">{order.restaurants?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{order.total.toLocaleString()} Kz</p>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium">{order.user_profiles?.full_name}</p>
                        <p className="text-sm text-gray-500">{order.user_profiles?.phone}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="on_way">A Caminho</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Entregadores */}
        <TabsContent value="drivers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gestão de Entregadores</h3>
            <Button className="bg-[#28a745] hover:bg-[#1e7e34]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Entregador
            </Button>
          </div>

          <div className="grid gap-4">
            {drivers.map((driver) => (
              <Card key={driver.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{driver.full_name}</h4>
                        <p className="text-sm text-gray-600">{driver.phone}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={driver.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {driver.is_available ? 'Disponível' : 'Ocupado'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ⭐ {driver.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {driver.vehicle_type} - {driver.license_plate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}