"use client"

import LogoutButton from "@/components/LogoutButton";
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
import { User, MapPin, CreditCard, Plus, Edit, Trash2, Star, Package } from 'lucide-react'
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
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

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

      const { data: addressesData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })

      if (addressesData) setAddresses(addressesData)

      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })

      if (paymentData) setPaymentMethods(paymentData)

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

      if (ordersData) setOrders(ordersData)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
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
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={updateProfile} className="bg-[#28a745] hover:bg-[#1e7e34] mt-4">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outras Abas (endereços, pagamentos, pedidos) seguem aqui */}
      </Tabs>
    </div>
  )
}

