"use client"

import { useState, useEffect } from 'react'
import { supabase, type UserProfile, type UserAddress, type PaymentMethod, type Order } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User, MapPin, CreditCard, Clock, Plus, Edit, Trash2, Star, Package } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfileProps {
  userId: string
  onClose: () => void
}

export function UserProfile({ userId, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  // Estados para formulários
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  })

  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    postal_code: '',
    is_default: false
  })

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Carregar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        setProfileForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          email: profileData.email || ''
        })
      }

      // Carregar endereços
      const { data: addressesData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })

      if (addressesData) {
        setAddresses(addressesData)
      }

      // Carregar métodos de pagamento
      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })

      if (paymentData) {
        setPaymentMethods(paymentData)
      }

      // Carregar histórico de pedidos
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (ordersData) {
        setOrders(ordersData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      toast.error('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          email: profileForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      loadUserData()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    }
  }

  const saveAddress = async () => {
    try {
      if (editingAddress) {
        // Atualizar endereço existente
        const { error } = await supabase
          .from('user_addresses')
          .update(addressForm)
          .eq('id', editingAddress.id)

        if (error) throw error
        toast.success('Endereço atualizado com sucesso!')
      } else {
        // Criar novo endereço
        const { error } = await supabase
          .from('user_addresses')
          .insert({
            ...addressForm,
            user_id: userId
          })

        if (error) throw error
        toast.success('Endereço adicionado com sucesso!')
      }

      setShowAddAddress(false)
      setEditingAddress(null)
      setAddressForm({
        title: '',
        address: '',
        city: '',
        postal_code: '',
        is_default: false
      })
      loadUserData()
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      toast.error('Erro ao salvar endereço')
    }
  }

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error

      toast.success('Endereço removido com sucesso!')
      loadUserData()
    } catch (error) {
      console.error('Erro ao remover endereço:', error)
      toast.error('Erro ao remover endereço')
    }
  }

  const setDefaultAddress = async (addressId: string) => {
    try {
      // Remover default de todos os endereços
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)

      // Definir novo default
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error

      toast.success('Endereço padrão atualizado!')
      loadUserData()
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error)
      toast.error('Erro ao definir endereço padrão')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
        <Button variant="ghost" onClick={onClose}>
          ✕
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">Alterar Foto</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={updateProfile} className="bg-[#28a745] hover:bg-[#1e7e34]">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Endereços */}
        <TabsContent value="addresses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Endereços Salvos</h3>
            <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
              <DialogTrigger asChild>
                <Button className="bg-[#28a745] hover:bg-[#1e7e34]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Endereço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      placeholder="Casa, Trabalho, etc."
                      value={addressForm.title}
                      onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      placeholder="Rua, número, bairro..."
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">CEP</Label>
                      <Input
                        id="postal_code"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    />
                    <Label htmlFor="is_default">Definir como endereço padrão</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={saveAddress} className="bg-[#28a745] hover:bg-[#1e7e34]">
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddAddress(false)
                      setEditingAddress(null)
                      setAddressForm({
                        title: '',
                        address: '',
                        city: '',
                        postal_code: '',
                        is_default: false
                      })
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{address.title}</h4>
                        {address.is_default && (
                          <Badge className="bg-[#28a745] text-white">Padrão</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">{address.address}</p>
                      <p className="text-sm text-gray-500">{address.city} - {address.postal_code}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAddress(address)
                          setAddressForm({
                            title: address.title,
                            address: address.address,
                            city: address.city,
                            postal_code: address.postal_code,
                            is_default: address.is_default
                          })
                          setShowAddAddress(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultAddress(address.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAddress(address.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Métodos de Pagamento */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Métodos de Pagamento</h3>
            <Button className="bg-[#28a745] hover:bg-[#1e7e34]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>

          <div className="grid gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {method.brand?.toUpperCase()} •••• {method.last_four}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.type === 'card' ? 'Cartão de Crédito' : 'Conta Bancária'}
                        </p>
                      </div>
                      {method.is_default && (
                        <Badge className="bg-[#28a745] text-white">Padrão</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Histórico de Pedidos */}
        <TabsContent value="orders" className="space-y-6">
          <h3 className="text-lg font-semibold">Histórico de Pedidos</h3>
          
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold">Pedido #{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{(item.price * item.quantity).toLocaleString()} Kz</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">{order.total.toLocaleString()} Kz</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Avaliar
                        </Button>
                      )}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <Button variant="outline" size="sm">
                          Rastrear
                        </Button>
                      )}
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