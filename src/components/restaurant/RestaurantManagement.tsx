"use client"

import { useState, useEffect } from 'react'
import { supabase, type Restaurant, type MenuItem } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  DollarSign,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface RestaurantManagementProps {
  restaurantId: string
  onClose: () => void
}

export function RestaurantManagement({ restaurantId, onClose }: RestaurantManagementProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Estados para formulários
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    delivery_fee: 0,
    min_order_value: 0,
    category: '',
    is_open: true,
    opening_hours: {}
  })

  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    is_available: true
  })

  const categories = [
    'Entrada',
    'Prato Principal',
    'Sobremesa',
    'Bebida',
    'Lanche',
    'Pizza',
    'Hambúrguer',
    'Sushi',
    'Salada',
    'Outro'
  ]

  useEffect(() => {
    loadRestaurantData()
  }, [restaurantId])

  const loadRestaurantData = async () => {
    try {
      setLoading(true)

      // Carregar dados do restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (restaurantError) throw restaurantError

      if (restaurantData) {
        setRestaurant(restaurantData)
        setRestaurantForm({
          name: restaurantData.name || '',
          description: restaurantData.description || '',
          phone: restaurantData.phone || '',
          email: restaurantData.email || '',
          address: restaurantData.address || '',
          delivery_fee: restaurantData.delivery_fee || 0,
          min_order_value: restaurantData.min_order_value || 0,
          category: restaurantData.category || '',
          is_open: restaurantData.is_open || false,
          opening_hours: restaurantData.opening_hours || {}
        })
      }

      // Carregar itens do cardápio
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category', { ascending: true })

      if (menuError) throw menuError

      if (menuData) {
        setMenuItems(menuData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados do restaurante:', error)
      toast.error('Erro ao carregar dados do restaurante')
    } finally {
      setLoading(false)
    }
  }

  const updateRestaurant = async () => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          ...restaurantForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)

      if (error) throw error

      toast.success('Restaurante atualizado com sucesso!')
      loadRestaurantData()
    } catch (error) {
      console.error('Erro ao atualizar restaurante:', error)
      toast.error('Erro ao atualizar restaurante')
    }
  }

  const saveMenuItem = async () => {
    try {
      if (editingItem) {
        // Atualizar item existente
        const { error } = await supabase
          .from('menu_items')
          .update({
            ...menuItemForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) throw error
        toast.success('Item atualizado com sucesso!')
      } else {
        // Criar novo item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            ...menuItemForm,
            restaurant_id: restaurantId
          })

        if (error) throw error
        toast.success('Item adicionado com sucesso!')
      }

      setShowAddItem(false)
      setEditingItem(null)
      setMenuItemForm({
        name: '',
        description: '',
        price: 0,
        category: '',
        image_url: '',
        is_available: true
      })
      loadRestaurantData()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item do cardápio')
    }
  }

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item removido com sucesso!')
      loadRestaurantData()
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast.error('Erro ao remover item')
    }
  }

  const toggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          is_available: !isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) throw error

      toast.success(`Item ${!isAvailable ? 'disponibilizado' : 'indisponibilizado'}!`)
      loadRestaurantData()
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error)
      toast.error('Erro ao alterar disponibilidade do item')
    }
  }

  const toggleRestaurantStatus = async () => {
    try {
      const newStatus = !restaurant?.is_open
      
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          is_open: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)

      if (error) throw error

      toast.success(`Restaurante ${newStatus ? 'aberto' : 'fechado'} com sucesso!`)
      loadRestaurantData()
    } catch (error) {
      console.error('Erro ao alterar status do restaurante:', error)
      toast.error('Erro ao alterar status do restaurante')
    }
  }

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as { [key: string]: MenuItem[] })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {restaurant?.name}
          </h1>
          <Badge className={restaurant?.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {restaurant?.is_open ? 'Aberto' : 'Fechado'}
          </Badge>
          <Button
            variant="outline"
            onClick={toggleRestaurantStatus}
            className={restaurant?.is_open ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-green-500 text-green-500 hover:bg-green-50'}
          >
            {restaurant?.is_open ? 'Fechar' : 'Abrir'} Restaurante
          </Button>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cardápio
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horários
          </TabsTrigger>
        </TabsList>

        {/* Aba Informações */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Restaurante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Restaurante</Label>
                  <Input
                    id="name"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={restaurantForm.category}
                    onValueChange={(value) => setRestaurantForm({ ...restaurantForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                      <SelectItem value="fast_food">Fast Food</SelectItem>
                      <SelectItem value="pizza">Pizzaria</SelectItem>
                      <SelectItem value="sushi">Sushi</SelectItem>
                      <SelectItem value="bakery">Padaria</SelectItem>
                      <SelectItem value="coffee">Cafeteria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={restaurantForm.phone}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantForm.email}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Taxa de Entrega (Kz)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    value={restaurantForm.delivery_fee}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, delivery_fee: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Pedido Mínimo (Kz)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    value={restaurantForm.min_order_value}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, min_order_value: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={restaurantForm.address}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={restaurantForm.description}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                />
              </div>

              <Button onClick={updateRestaurant} className="bg-[#28a745] hover:bg-[#1e7e34]">
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Cardápio */}
        <TabsContent value="menu" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cardápio</h3>
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild>
                <Button className="bg-[#28a745] hover:bg-[#1e7e34]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Editar Item' : 'Novo Item do Cardápio'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_name">Nome do Item</Label>
                    <Input
                      id="item_name"
                      value={menuItemForm.name}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_description">Descrição</Label>
                    <Textarea
                      id="item_description"
                      value={menuItemForm.description}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_price">Preço (Kz)</Label>
                      <Input
                        id="item_price"
                        type="number"
                        value={menuItemForm.price}
                        onChange={(e) => setMenuItemForm({ ...menuItemForm, price: Number(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item_category">Categoria</Label>
                      <Select
                        value={menuItemForm.category}
                        onValueChange={(value) => setMenuItemForm({ ...menuItemForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_image">URL da Imagem</Label>
                    <Input
                      id="item_image"
                      value={menuItemForm.image_url}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item_available"
                      checked={menuItemForm.is_available}
                      onCheckedChange={(checked) => setMenuItemForm({ ...menuItemForm, is_available: checked })}
                    />
                    <Label htmlFor="item_available">Item disponível</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={saveMenuItem} className="bg-[#28a745] hover:bg-[#1e7e34]">
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddItem(false)
                      setEditingItem(null)
                      setMenuItemForm({
                        name: '',
                        description: '',
                        price: 0,
                        category: '',
                        image_url: '',
                        is_available: true
                      })
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedMenuItems).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  {category}
                </h4>
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h5 className="font-semibold">{item.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {item.description}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-[#28a745]">
                                  {item.price.toLocaleString()} Kz
                                </span>
                                <Badge className={item.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {item.is_available ? 'Disponível' : 'Indisponível'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleItemAvailability(item.id, item.is_available)}
                            >
                              {item.is_available ? 'Indisponibilizar' : 'Disponibilizar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item)
                                setMenuItemForm({
                                  name: item.name,
                                  description: item.description,
                                  price: item.price,
                                  category: item.category,
                                  image_url: item.image_url,
                                  is_available: item.is_available
                                })
                                setShowAddItem(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMenuItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {menuItems.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhum item no cardápio ainda</p>
                <p className="text-sm text-gray-400">Adicione o primeiro item para começar</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba Horários */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">{day}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Input type="time" className="w-32" defaultValue="09:00" />
                        <span>às</span>
                        <Input type="time" className="w-32" defaultValue="22:00" />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4 bg-[#28a745] hover:bg-[#1e7e34]">
                <Save className="w-4 h-4 mr-2" />
                Salvar Horários
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}