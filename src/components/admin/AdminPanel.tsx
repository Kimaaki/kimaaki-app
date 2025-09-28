"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Building2, 
  Truck, 
  Shield, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  X,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Car,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Star,
  Activity,
  Percent,
  Crown,
  Edit,
  Save,
  Globe
} from 'lucide-react'
import { supabase, type UserRegistration, getUsersByRole, getPendingRegistrations, updateUserRegistrationStatus } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminPanelProps {
  onClose: () => void
}

interface Company {
  id: string
  company_name: string
  responsible_name: string
  nif: string
  address: string
  contacts: string
  email: string
  plan: 'basic' | 'premium'
  commercial_license_url?: string
  company_publication_url?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
  updated_at?: string
}

interface DeliveryDriver {
  id: string
  full_name: string
  phone: string
  address: string
  identification_document_url?: string
  driving_license_url?: string
  vehicle_photo_url?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
  updated_at?: string
}

interface Order {
  id: string
  user_id: string
  restaurant_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_way' | 'delivered' | 'cancelled'
  items: any
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total: number
  delivery_address: any
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_type: 'platform_delivery' | 'self_delivery' | 'pickup'
  scheduled_delivery?: string
  driver_id?: string
  coupon_code?: string
  created_at: string
  updated_at: string
}

interface CommissionConfig {
  id: string
  country: string
  city?: string
  plan_type: 'basic' | 'premium'
  delivery_type: 'platform_delivery' | 'self_delivery' | 'pickup'
  commission_percentage: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface Statistics {
  totalUsers: number
  totalCompanies: number
  totalDrivers: number
  totalOrders: number
  pendingApprovals: number
  monthlyRevenue: number
  activeOrders: number
  completedOrders: number
}

const planDetails = {
  basic: {
    name: 'Plano Básico',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    commissions: {
      platform_delivery: 15,
      self_delivery: 8,
      pickup: 5
    }
  },
  premium: {
    name: 'Plano Premium',
    icon: Crown,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    commissions: {
      platform_delivery: 20,
      self_delivery: 12,
      pickup: 8
    }
  }
}

function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<UserRegistration[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [deliveryDrivers, setDeliveryDrivers] = useState<DeliveryDriver[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [commissions, setCommissions] = useState<CommissionConfig[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalUsers: 0,
    totalCompanies: 0,
    totalDrivers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    completedOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserRegistration | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [showDriverDetails, setShowDriverDetails] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [userToReject, setUserToReject] = useState<UserRegistration | null>(null)
  const [companyToReject, setCompanyToReject] = useState<Company | null>(null)
  const [driverToReject, setDriverToReject] = useState<DeliveryDriver | null>(null)
  const [newCommission, setNewCommission] = useState<Partial<CommissionConfig>>({
    country: 'Angola',
    plan_type: 'basic',
    delivery_type: 'platform_delivery',
    commission_percentage: 15,
    is_active: true
  })
  const [editingCompanyPlan, setEditingCompanyPlan] = useState<string | null>(null)

  const roleConfig = {
    cliente: {
      title: 'Cliente',
      icon: User,
      color: 'bg-blue-500',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    empresa: {
      title: 'Empresa',
      icon: Building2,
      color: 'bg-green-500',
      badgeColor: 'bg-green-100 text-green-800'
    },
    entregador: {
      title: 'Entregador',
      icon: Truck,
      color: 'bg-orange-500',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    admin: {
      title: 'Admin',
      icon: Shield,
      color: 'bg-red-500',
      badgeColor: 'bg-red-100 text-red-800'
    }
  }

  const statusConfig = {
    pending: {
      title: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock
    },
    approved: {
      title: 'Aprovado',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    },
    rejected: {
      title: 'Rejeitado',
      color: 'bg-red-100 text-red-800',
      icon: XCircle
    },
    confirmed: {
      title: 'Confirmado',
      color: 'bg-blue-100 text-blue-800',
      icon: CheckCircle
    },
    preparing: {
      title: 'Preparando',
      color: 'bg-orange-100 text-orange-800',
      icon: Clock
    },
    ready: {
      title: 'Pronto',
      color: 'bg-purple-100 text-purple-800',
      icon: Package
    },
    on_way: {
      title: 'A Caminho',
      color: 'bg-indigo-100 text-indigo-800',
      icon: Truck
    },
    delivered: {
      title: 'Entregue',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    },
    cancelled: {
      title: 'Cancelado',
      color: 'bg-red-100 text-red-800',
      icon: XCircle
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar usuários
      const { data: allUsers, error: usersError } = await supabase
        .from('user_registrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) throw usersError
      setUsers(allUsers || [])

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (companiesError) {
        console.error('Erro ao carregar empresas:', companiesError)
      } else {
        setCompanies(companiesData || [])
      }

      // Carregar entregadores
      const { data: driversData, error: driversError } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (driversError) {
        console.error('Erro ao carregar entregadores:', driversError)
      } else {
        setDeliveryDrivers(driversData || [])
      }

      // Carregar pedidos (simulados - em produção viria do Supabase)
      const mockOrders: Order[] = [
        {
          id: '1',
          user_id: 'user-1',
          restaurant_id: 'rest-1',
          status: 'confirmed',
          items: [{ name: 'Muamba de Galinha', quantity: 1, price: 2500 }],
          subtotal: 2500,
          delivery_fee: 500,
          discount_amount: 0,
          total: 3000,
          delivery_address: { address: 'Rua da Missão, Luanda' },
          payment_method: 'card',
          payment_status: 'paid',
          delivery_type: 'platform_delivery',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user-2',
          restaurant_id: 'rest-2',
          status: 'on_way',
          items: [{ name: 'Pizza Margherita', quantity: 2, price: 1800 }],
          subtotal: 3600,
          delivery_fee: 300,
          discount_amount: 200,
          total: 3700,
          delivery_address: { address: 'Av. Marginal, Luanda' },
          payment_method: 'mpesa',
          payment_status: 'paid',
          delivery_type: 'self_delivery',
          driver_id: 'driver-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setOrders(mockOrders)

      // Carregar configurações de comissão (simuladas)
      const mockCommissions: CommissionConfig[] = [
        {
          id: '1',
          country: 'Angola',
          city: 'Luanda',
          plan_type: 'basic',
          delivery_type: 'platform_delivery',
          commission_percentage: 15,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          country: 'Cabo Verde',
          plan_type: 'premium',
          delivery_type: 'self_delivery',
          commission_percentage: 12,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
      setCommissions(mockCommissions)

      // Calcular estatísticas
      const stats: Statistics = {
        totalUsers: allUsers?.length || 0,
        totalCompanies: companiesData?.length || 0,
        totalDrivers: driversData?.length || 0,
        totalOrders: mockOrders.length,
        pendingApprovals: (allUsers?.filter(u => u.status === 'pending').length || 0) + 
                         (companiesData?.filter(c => c.status === 'pending').length || 0) + 
                         (driversData?.filter(d => d.status === 'pending').length || 0),
        monthlyRevenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
        activeOrders: mockOrders.filter(o => ['confirmed', 'preparing', 'ready', 'on_way'].includes(o.status)).length,
        completedOrders: mockOrders.filter(o => o.status === 'delivered').length
      }
      setStatistics(stats)

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (user: UserRegistration) => {
    try {
      const { error } = await updateUserRegistrationStatus(user.id, 'approved')
      if (error) throw error

      toast.success(`Usuário ${user.full_name || user.company_name || user.email} aprovado com sucesso!`)
      loadData()
    } catch (error: any) {
      console.error('Erro ao aprovar usuário:', error)
      toast.error('Erro ao aprovar usuário: ' + error.message)
    }
  }

  const handleApproveCompany = async (company: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)

      if (error) throw error

      toast.success(`Empresa ${company.company_name} aprovada com sucesso!`)
      loadData()
    } catch (error: any) {
      console.error('Erro ao aprovar empresa:', error)
      toast.error('Erro ao aprovar empresa: ' + error.message)
    }
  }

  const handleApproveDriver = async (driver: DeliveryDriver) => {
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.id)

      if (error) throw error

      toast.success(`Entregador ${driver.full_name} aprovado com sucesso!`)
      loadData()
    } catch (error: any) {
      console.error('Erro ao aprovar entregador:', error)
      toast.error('Erro ao aprovar entregador: ' + error.message)
    }
  }

  const handleUpdateCompanyPlan = async (companyId: string, newPlan: 'basic' | 'premium') => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          plan: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)

      if (error) throw error

      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, plan: newPlan, updated_at: new Date().toISOString() }
          : company
      ))

      toast.success(`Plano da empresa atualizado para ${planDetails[newPlan].name}!`)
      setEditingCompanyPlan(null)
    } catch (error: any) {
      console.error('Erro ao atualizar plano da empresa:', error)
      toast.error('Erro ao atualizar plano da empresa: ' + error.message)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Em produção, isso seria uma chamada ao Supabase
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
          : order
      ))
      
      toast.success('Status do pedido atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar status do pedido:', error)
      toast.error('Erro ao atualizar status do pedido: ' + error.message)
    }
  }

  const handleSaveCommission = async () => {
    try {
      if (!newCommission.country || !newCommission.plan_type || !newCommission.delivery_type || !newCommission.commission_percentage) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      // Em produção, isso seria uma chamada ao Supabase
      const commission: CommissionConfig = {
        id: Date.now().toString(),
        country: newCommission.country!,
        city: newCommission.city,
        plan_type: newCommission.plan_type as any,
        delivery_type: newCommission.delivery_type as any,
        commission_percentage: newCommission.commission_percentage,
        is_active: newCommission.is_active || true,
        created_at: new Date().toISOString()
      }

      setCommissions(prev => [...prev, commission])
      setNewCommission({
        country: 'Angola',
        plan_type: 'basic',
        delivery_type: 'platform_delivery',
        commission_percentage: 15,
        is_active: true
      })
      
      toast.success('Configuração de comissão salva com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar comissão:', error)
      toast.error('Erro ao salvar comissão: ' + error.message)
    }
  }

  const calculateCommission = (order: Order, companyPlan: 'basic' | 'premium') => {
    const planConfig = planDetails[companyPlan]
    const commissionRate = planConfig.commissions[order.delivery_type] / 100
    return order.subtotal * commissionRate
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.company_name && user.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    
    return matchesSearch && matchesRole
  })

  const filteredCompanies = companies.filter(company => {
    return company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           company.responsible_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           company.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredDrivers = deliveryDrivers.filter(driver => {
    return driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           driver.phone.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredOrders = orders.filter(order => {
    return order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Dashboard Component
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empresas Cadastradas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalCompanies}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregadores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pedidos Totais</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprovações Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pendingApprovals}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Mensal</p>
                <p className="text-2xl font-bold text-green-600">{statistics.monthlyRevenue.toLocaleString()} Kz</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pedidos Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Relatórios Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Pedidos por Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusConfig).filter(([key]) => 
                ['confirmed', 'preparing', 'ready', 'on_way', 'delivered'].includes(key)
              ).map(([status, config]) => {
                const count = orders.filter(o => o.status === status).length
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-').replace('100', '500')}`}></div>
                      <span className="text-sm">{config.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Usuários por Tipo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(roleConfig).map(([role, config]) => {
                const count = users.filter(u => u.role === role).length
                const percentage = users.length > 0 ? (count / users.length) * 100 : 0
                
                return (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                      <span className="text-sm">{config.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Orders Management Component
  const OrdersManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestão de Pedidos</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusConfig[order.status].icon
          const mockCompanyPlan: 'basic' | 'premium' = Math.random() > 0.5 ? 'premium' : 'basic'
          const commission = calculateCommission(order, mockCompanyPlan)
          
          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Pedido #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                        <span>Total: {order.total.toLocaleString()} Kz</span>
                        <span>Comissão: {commission.toFixed(0)} Kz</span>
                        <Badge variant="outline" className="text-xs">
                          {order.delivery_type === 'platform_delivery' ? 'Plataforma' : 
                           order.delivery_type === 'self_delivery' ? 'Self-Delivery' : 'Pickup'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={statusConfig[order.status].color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[order.status].title}
                    </Badge>
                    
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Novo</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="ready">Pronto</SelectItem>
                        <SelectItem value="on_way">A Caminho</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderDetails(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  // Commission Configuration Component
  const CommissionConfig = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Configuração de Taxas e Comissões</h2>
      </div>

      {/* Planos Padrão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(planDetails).map(([planKey, plan]) => {
          const PlanIcon = plan.icon
          
          return (
            <Card key={planKey}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    planKey === 'premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-blue-500'
                  }`}>
                    <PlanIcon className="w-5 h-5 text-white" />
                  </div>
                  <span>{plan.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Entregadores da Plataforma:</span>
                    <Badge variant="outline">{plan.commissions.platform_delivery}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Self-Delivery:</span>
                    <Badge variant="outline">{plan.commissions.self_delivery}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retirada/Pickup:</span>
                    <Badge variant="outline">{plan.commissions.pickup}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Nova Configuração por País/Cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Configuração por Localização</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>País</Label>
              <Select
                value={newCommission.country}
                onValueChange={(value) => setNewCommission(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Angola">Angola</SelectItem>
                  <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                  <SelectItem value="Moçambique">Moçambique</SelectItem>
                  <SelectItem value="São Tomé e Príncipe">São Tomé e Príncipe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cidade (opcional)</Label>
              <Input
                placeholder="Ex: Luanda"
                value={newCommission.city || ''}
                onChange={(e) => setNewCommission(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div>
              <Label>Tipo de Plano</Label>
              <Select
                value={newCommission.plan_type}
                onValueChange={(value) => setNewCommission(prev => ({ ...prev, plan_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Entrega</Label>
              <Select
                value={newCommission.delivery_type}
                onValueChange={(value) => setNewCommission(prev => ({ ...prev, delivery_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_delivery">Plataforma</SelectItem>
                  <SelectItem value="self_delivery">Self-Delivery</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newCommission.commission_percentage || ''}
                onChange={(e) => setNewCommission(prev => ({ 
                  ...prev, 
                  commission_percentage: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Ex: 15"
              />
            </div>
          </div>

          <Button onClick={handleSaveCommission} className="bg-green-600 hover:bg-green-700">
            <Settings className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Configurações Existentes */}
      <div className="grid gap-4">
        {commissions.map((commission) => (
          <Card key={commission.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Percent className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {commission.country}{commission.city && ` - ${commission.city}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {planDetails[commission.plan_type].name} • {
                        commission.delivery_type === 'platform_delivery' ? 'Plataforma' :
                        commission.delivery_type === 'self_delivery' ? 'Self-Delivery' : 'Pickup'
                      } • {commission.commission_percentage}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={commission.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {commission.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCommissions(prev => prev.map(c => 
                        c.id === commission.id 
                          ? { ...c, is_active: !c.is_active, updated_at: new Date().toISOString() }
                          : c
                      ))
                      toast.success(`Configuração ${commission.is_active ? 'desativada' : 'ativada'}`)
                    }}
                  >
                    {commission.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Reports Component
  const ReportsView = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Relatórios e Estatísticas</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relatório de Vendas por Parceiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Vendas por Parceiro</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between">
                  <span className="text-sm">{company.company_name}</span>
                  <span className="text-sm font-medium">
                    {Math.floor(Math.random() * 50000).toLocaleString()} Kz
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relatório de Entregas por Entregador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5" />
              <span>Entregas por Entregador</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveryDrivers.slice(0, 5).map((driver) => (
                <div key={driver.id} className="flex items-center justify-between">
                  <span className="text-sm">{driver.full_name}</span>
                  <span className="text-sm font-medium">
                    {Math.floor(Math.random() * 100)} entregas
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relatório de Clientes Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Clientes Ativos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.filter(u => u.role === 'cliente').slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <span className="text-sm">{user.full_name || user.email}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{(Math.random() * 2 + 3).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{statistics.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Receita Total (Kz)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{statistics.totalOrders}</p>
              <p className="text-sm text-gray-600">Pedidos Realizados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{statistics.activeOrders}</p>
              <p className="text-sm text-gray-600">Pedidos Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{((statistics.completedOrders / statistics.totalOrders) * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Taxa de Conclusão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Painel de Administração KIMAAKI</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todos os aspectos da plataforma</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Entregadores</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardView />
        </TabsContent>

        <TabsContent value="companies">
          {/* Gestão de Empresas com Planos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestão de Empresas</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {filteredCompanies.map((company) => {
              const StatusIcon = statusConfig[company.status].icon
              const plan = planDetails[company.plan || 'basic']
              const PlanIcon = plan.icon
              
              return (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {company.company_name}
                            </h3>
                            <Badge className={plan.badgeColor}>
                              <PlanIcon className="w-3 h-3 mr-1" />
                              {plan.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {company.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Responsável: {company.responsible_name} • NIF: {company.nif}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={statusConfig[company.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[company.status].title}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          {/* Alterar Plano */}
                          {company.status === 'approved' && (
                            <>
                              {editingCompanyPlan === company.id ? (
                                <div className="flex items-center space-x-2">
                                  <Select
                                    value={company.plan}
                                    onValueChange={(value) => handleUpdateCompanyPlan(company.id, value as 'basic' | 'premium')}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="basic">Básico</SelectItem>
                                      <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCompanyPlan(null)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingCompanyPlan(company.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCompany(company)
                              setShowCompanyDetails(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {company.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveCompany(company)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setCompanyToReject(company)
                                  setShowRejectionDialog(true)
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="drivers">
          {/* Reutilizar componente de entregadores do UserManagement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestão de Entregadores</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar entregadores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {filteredDrivers.map((driver) => {
              const StatusIcon = statusConfig[driver.status].icon
              
              return (
                <Card key={driver.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {driver.full_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {driver.phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            {driver.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={statusConfig[driver.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[driver.status].title}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDriver(driver)
                              setShowDriverDetails(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {driver.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveDriver(driver)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDriverToReject(driver)
                                  setShowRejectionDialog(true)
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="users">
          {/* Reutilizar componente de usuários do UserManagement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestão de Usuários</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="cliente">Clientes</SelectItem>
                    <SelectItem value="empresa">Empresas</SelectItem>
                    <SelectItem value="entregador">Entregadores</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredUsers.map((user) => {
              const RoleIcon = roleConfig[user.role].icon
              const StatusIcon = statusConfig[user.status].icon
              
              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${roleConfig[user.role].color} rounded-full flex items-center justify-center`}>
                          <RoleIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {user.full_name || user.company_name || user.email}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.phone || 'Sem telefone'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={roleConfig[user.role].badgeColor}>
                          {roleConfig[user.role].title}
                        </Badge>
                        <Badge className={statusConfig[user.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[user.status].title}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserDetails(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {user.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveUser(user)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setUserToReject(user)
                                  setShowRejectionDialog(true)
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="settings">
          <Tabs defaultValue="commissions">
            <TabsList>
              <TabsTrigger value="commissions">Taxas e Comissões</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="commissions">
              <CommissionConfig />
            </TabsContent>
            
            <TabsContent value="reports">
              <ReportsView />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Dialogs reutilizados do UserManagement */}
      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Rejeitar Cadastro</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Você está prestes a rejeitar o cadastro de{' '}
              <strong>
                {userToReject ? (userToReject.full_name || userToReject.company_name || userToReject.email) : 
                 companyToReject ? companyToReject.company_name :
                 driverToReject ? driverToReject.full_name : ''}
              </strong>.
            </p>

            <div>
              <Label htmlFor="rejection-reason">Motivo da rejeição *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explique o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false)
                  setUserToReject(null)
                  setCompanyToReject(null)
                  setDriverToReject(null)
                  setRejectionReason('')
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (userToReject) {
                    // Handle user rejection
                  } else if (companyToReject) {
                    // Handle company rejection
                  } else if (driverToReject) {
                    // Handle driver rejection
                  }
                }}
                disabled={!rejectionReason.trim()}
                className="flex-1"
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AdminPanel }
export default AdminPanel