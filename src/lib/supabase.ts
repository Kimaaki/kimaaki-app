import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug útil no build da Vercel
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ MISSING')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ OK' : '❌ MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  // Evita quebrar o build
  console.warn('⚠️ Supabase env vars faltando no build. Verifique Settings → Environment Variables.')
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',   // placeholder só para build
  supabaseAnonKey || 'invalid'
)

// Tipos para o banco de dados
export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url?: string
  role?: 'cliente' | 'empresa' | 'entregador' | 'admin'
  status?: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface UserRegistration {
  id: string
  email: string
  role: 'cliente' | 'empresa' | 'entregador' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  
  // Campos comuns
  phone: string
  
  // Campos para Cliente
  full_name?: string
  address?: string
  age?: number
  
  // Campos para Empresa
  company_name?: string
  responsible_name?: string
  nif?: string
  company_address?: string
  company_contacts?: string
  
  // Campos para Entregador
  delivery_address?: string
  
  // Documentos e aprovação
  documents?: string[] // Array de URLs dos documentos
  rejection_reason?: string
  created_at: string
  updated_at?: string
}

export interface Company {
  id: string
  user_id?: string
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

export interface DeliveryDriver {
  id: string
  user_id?: string
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

export interface UserAddress {
  id: string
  user_id: string
  title: string
  address: string
  city: string
  postal_code: string
  is_default: boolean
  created_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  stripe_payment_method_id: string
  type: 'card' | 'bank_account'
  last_four: string
  brand?: string
  is_default: boolean
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  min_order_value?: number
  max_uses?: number
  used_count: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  description: string
  image_url: string
  phone: string
  email: string
  address: string
  is_open: boolean
  opening_hours: any
  delivery_fee: number
  min_order_value: number
  rating: number
  category: string
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
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
  commission_amount?: number
  commission_rate?: number
  created_at: string
  updated_at: string
}

export interface CommissionConfig {
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

export interface AdminStatistics {
  totalUsers: number
  totalCompanies: number
  totalDrivers: number
  totalOrders: number
  pendingApprovals: number
  monthlyRevenue: number
  activeOrders: number
  completedOrders: number
}

export interface Driver {
  id: string
  full_name: string
  phone: string
  email: string
  vehicle_type: string
  license_plate: string
  is_available: boolean
  rating: number
  current_location?: any
  created_at: string
}

// Definições de planos e comissões
export const PLAN_DETAILS = {
  basic: {
    name: 'Plano Básico',
    commissions: {
      platform_delivery: 15,
      self_delivery: 8,
      pickup: 5
    },
    features: [
      'Comissão: 15% (entregadores da plataforma)',
      'Comissão: 8% (self-delivery)',
      'Comissão: 5% (retirada/pickup)',
      'Visibilidade padrão no aplicativo'
    ]
  },
  premium: {
    name: 'Plano Premium',
    commissions: {
      platform_delivery: 20,
      self_delivery: 12,
      pickup: 8
    },
    features: [
      'Comissão: 20% (entregadores da plataforma)',
      'Comissão: 12% (self-delivery)',
      'Comissão: 8% (retirada/pickup)',
      'Destaque nos resultados de busca',
      'Aparecer na seção "Recomendados"',
      'Participação em campanhas de marketing'
    ]
  }
} as const

// Funções utilitárias para trabalhar com registros de usuários
export const getUserRegistration = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_registrations')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const createUserRegistration = async (registrationData: Omit<UserRegistration, 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_registrations')
    .insert({
      ...registrationData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateUserRegistrationStatus = async (userId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }
  
  const { data, error } = await supabase
    .from('user_registrations')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const getUsersByRole = async (role: 'cliente' | 'empresa' | 'entregador' | 'admin') => {
  const { data, error } = await supabase
    .from('user_registrations')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getPendingRegistrations = async () => {
  const { data, error } = await supabase
    .from('user_registrations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Funções para empresas
export const createCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      ...companyData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  return { data, error }
}

export const getCompanyById = async (companyId: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()
  
  return { data, error }
}

export const getCompaniesByStatus = async (status: 'pending' | 'approved' | 'rejected') => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getAllCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const updateCompanyStatus = async (companyId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }
  
  const { data, error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', companyId)
    .select()
    .single()
  
  return { data, error }
}

export const updateCompanyPlan = async (companyId: string, plan: 'basic' | 'premium') => {
  const { data, error } = await supabase
    .from('companies')
    .update({
      plan,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId)
    .select()
    .single()
  
  return { data, error }
}

export const getCompanyByNIF = async (nif: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('nif', nif)
    .single()
  
  return { data, error }
}

// Funções para entregadores
export const createDeliveryDriver = async (driverData: Omit<DeliveryDriver, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .insert({
      ...driverData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  return { data, error }
}

export const getDeliveryDriverById = async (driverId: string) => {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select('*')
    .eq('id', driverId)
    .single()
  
  return { data, error }
}

export const getDeliveryDriversByStatus = async (status: 'pending' | 'approved' | 'rejected') => {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getAllDeliveryDrivers = async () => {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const updateDeliveryDriverStatus = async (driverId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }
  
  const { data, error } = await supabase
    .from('delivery_drivers')
    .update(updateData)
    .eq('id', driverId)
    .select()
    .single()
  
  return { data, error }
}

export const getDeliveryDriverByPhone = async (phone: string) => {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select('*')
    .eq('phone', phone)
    .single()
  
  return { data, error }
}

// Funções para pedidos
export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  
  return { data, error }
}

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()
  
  return { data, error }
}

export const getOrdersByStatus = async (status: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Funções para configurações de comissão
export const getAllCommissionConfigs = async () => {
  const { data, error } = await supabase
    .from('commission_configs')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createCommissionConfig = async (configData: Omit<CommissionConfig, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('commission_configs')
    .insert({
      ...configData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateCommissionConfig = async (configId: string, updates: Partial<CommissionConfig>) => {
  const { data, error } = await supabase
    .from('commission_configs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', configId)
    .select()
    .single()
  
  return { data, error }
}

export const getCommissionConfigByCategory = async (country: string, planType: 'basic' | 'premium', deliveryType: 'platform_delivery' | 'self_delivery' | 'pickup', city?: string) => {
  let query = supabase
    .from('commission_configs')
    .select('*')
    .eq('country', country)
    .eq('plan_type', planType)
    .eq('delivery_type', deliveryType)
    .eq('is_active', true)
  
  if (city) {
    query = query.eq('city', city)
  }
  
  const { data, error } = await query.single()
  
  return { data, error }
}

// Função para calcular comissão de um pedido
export const calculateOrderCommission = async (
  order: Pick<Order, 'subtotal' | 'delivery_type'>,
  companyPlan: 'basic' | 'premium',
  country: string = 'Angola',
  city?: string
): Promise<{ commission: number; rate: number }> => {
  try {
    // Primeiro, tentar buscar configuração específica por localização
    const { data: customConfig } = await getCommissionConfigByCategory(
      country,
      companyPlan,
      order.delivery_type,
      city
    )

    let commissionRate: number

    if (customConfig) {
      // Usar configuração personalizada
      commissionRate = customConfig.commission_percentage
    } else {
      // Usar configuração padrão do plano
      commissionRate = PLAN_DETAILS[companyPlan].commissions[order.delivery_type]
    }

    const commission = (order.subtotal * commissionRate) / 100

    return {
      commission: Math.round(commission),
      rate: commissionRate
    }
  } catch (error) {
    console.error('Erro ao calcular comissão:', error)
    
    // Fallback para configuração padrão
    const commissionRate = PLAN_DETAILS[companyPlan].commissions[order.delivery_type]
    const commission = (order.subtotal * commissionRate) / 100

    return {
      commission: Math.round(commission),
      rate: commissionRate
    }
  }
}

// Função para processar pedido com cálculo automático de comissão
export const processOrderWithCommission = async (
  orderData: Omit<Order, 'id' | 'commission_amount' | 'commission_rate' | 'created_at' | 'updated_at'>,
  companyId: string,
  country: string = 'Angola',
  city?: string
) => {
  try {
    // Buscar dados da empresa para obter o plano
    const { data: company, error: companyError } = await getCompanyById(companyId)
    
    if (companyError || !company) {
      throw new Error('Empresa não encontrada')
    }

    // Calcular comissão
    const { commission, rate } = await calculateOrderCommission(
      orderData,
      company.plan,
      country,
      city
    )

    // Criar pedido com comissão calculada
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        commission_amount: commission,
        commission_rate: rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao processar pedido com comissão:', error)
    return { data: null, error }
  }
}

// Funções para estatísticas administrativas
export const getAdminStatistics = async (): Promise<{ data: AdminStatistics | null, error: any }> => {
  try {
    // Buscar contagens de usuários
    const { data: users, error: usersError } = await supabase
      .from('user_registrations')
      .select('id, status, role')
    
    if (usersError) throw usersError

    // Buscar contagens de empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, status')
    
    if (companiesError) throw companiesError

    // Buscar contagens de entregadores
    const { data: drivers, error: driversError } = await supabase
      .from('delivery_drivers')
      .select('id, status')
    
    if (driversError) throw driversError

    // Buscar pedidos (se a tabela existir)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
    
    // Se a tabela de pedidos não existir, usar dados simulados
    const ordersData = ordersError ? [] : (orders || [])

    // Calcular estatísticas
    const statistics: AdminStatistics = {
      totalUsers: users?.length || 0,
      totalCompanies: companies?.length || 0,
      totalDrivers: drivers?.length || 0,
      totalOrders: ordersData.length,
      pendingApprovals: (users?.filter(u => u.status === 'pending').length || 0) + 
                       (companies?.filter(c => c.status === 'pending').length || 0) + 
                       (drivers?.filter(d => d.status === 'pending').length || 0),
      monthlyRevenue: ordersData.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
      activeOrders: ordersData.filter((o: any) => ['confirmed', 'preparing', 'ready', 'on_way'].includes(o.status)).length,
      completedOrders: ordersData.filter((o: any) => o.status === 'delivered').length
    }

    return { data: statistics, error: null }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return { data: null, error }
  }
}

// Função para obter relatório de comissões por período
export const getCommissionReport = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      commission_amount,
      commission_rate,
      delivery_type,
      created_at,
      restaurant_id
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .not('commission_amount', 'is', null)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Função para obter empresas com maior volume de comissões
export const getTopCompaniesByCommission = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      restaurant_id,
      commission_amount
    `)
    .not('commission_amount', 'is', null)

  if (error) return { data: null, error }

  // Agrupar por restaurant_id e somar comissões
  const commissionsByCompany = data?.reduce((acc: any, order: any) => {
    if (!acc[order.restaurant_id]) {
      acc[order.restaurant_id] = 0
    }
    acc[order.restaurant_id] += order.commission_amount
    return acc
  }, {})

  // Converter para array e ordenar
  const sortedCompanies = Object.entries(commissionsByCompany || {})
    .map(([restaurantId, totalCommission]) => ({
      restaurant_id: restaurantId,
      total_commission: totalCommission
    }))
    .sort((a: any, b: any) => b.total_commission - a.total_commission)
    .slice(0, limit)

  return { data: sortedCompanies, error: null }
}
