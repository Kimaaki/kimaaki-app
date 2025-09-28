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
  Car
} from 'lucide-react'
import { supabase, type UserRegistration, getUsersByRole, getPendingRegistrations, updateUserRegistrationStatus } from '@/lib/supabase'
import { toast } from 'sonner'

interface UserManagementProps {
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

function UserManagement({ onClose }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState('pending')
  const [users, setUsers] = useState<UserRegistration[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [deliveryDrivers, setDeliveryDrivers] = useState<DeliveryDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserRegistration | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [showDriverDetails, setShowDriverDetails] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [userToReject, setUserToReject] = useState<UserRegistration | null>(null)
  const [companyToReject, setCompanyToReject] = useState<Company | null>(null)
  const [driverToReject, setDriverToReject] = useState<DeliveryDriver | null>(null)

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
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar usuários
      let userData: UserRegistration[] = []
      if (activeTab === 'pending') {
        const { data: pendingUsers, error } = await getPendingRegistrations()
        if (error) throw error
        userData = pendingUsers || []
      } else if (activeTab === 'all') {
        const { data: allUsers, error } = await supabase
          .from('user_registrations')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        userData = allUsers || []
      } else if (activeTab !== 'companies' && activeTab !== 'delivery-drivers') {
        const { data: roleUsers, error } = await getUsersByRole(activeTab as any)
        if (error) throw error
        userData = roleUsers || []
      }

      // Carregar empresas
      let companyData: Company[] = []
      if (activeTab === 'companies' || activeTab === 'pending' || activeTab === 'all') {
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (companiesError) {
          console.error('Erro ao carregar empresas:', companiesError)
        } else {
          companyData = companiesData || []
        }
      }

      // Carregar entregadores
      let deliveryDriverData: DeliveryDriver[] = []
      if (activeTab === 'delivery-drivers' || activeTab === 'pending' || activeTab === 'all') {
        const { data: driversData, error: driversError } = await supabase
          .from('delivery_drivers')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (driversError) {
          console.error('Erro ao carregar entregadores:', driversError)
        } else {
          deliveryDriverData = driversData || []
        }
      }

      setUsers(userData)
      setCompanies(companyData)
      setDeliveryDrivers(deliveryDriverData)
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

      // Também atualizar na tabela user_registrations se existir
      await supabase
        .from('user_registrations')
        .update({ status: 'approved' })
        .eq('company_name', company.company_name)
        .eq('nif', company.nif)

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

      // Também atualizar na tabela user_registrations se existir
      await supabase
        .from('user_registrations')
        .update({ status: 'approved' })
        .eq('full_name', driver.full_name)
        .eq('phone', driver.phone)
        .eq('role', 'entregador')

      toast.success(`Entregador ${driver.full_name} aprovado com sucesso!`)
      loadData()
    } catch (error: any) {
      console.error('Erro ao aprovar entregador:', error)
      toast.error('Erro ao aprovar entregador: ' + error.message)
    }
  }

  const handleRejectUser = async () => {
    if (!userToReject || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório')
      return
    }

    try {
      const { error } = await updateUserRegistrationStatus(userToReject.id, 'rejected', rejectionReason)
      if (error) throw error

      toast.success(`Usuário ${userToReject.full_name || userToReject.company_name || userToReject.email} rejeitado`)
      setShowRejectionDialog(false)
      setUserToReject(null)
      setRejectionReason('')
      loadData()
    } catch (error: any) {
      console.error('Erro ao rejeitar usuário:', error)
      toast.error('Erro ao rejeitar usuário: ' + error.message)
    }
  }

  const handleRejectCompany = async () => {
    if (!companyToReject || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório')
      return
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyToReject.id)

      if (error) throw error

      // Também atualizar na tabela user_registrations se existir
      await supabase
        .from('user_registrations')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('company_name', companyToReject.company_name)
        .eq('nif', companyToReject.nif)

      toast.success(`Empresa ${companyToReject.company_name} rejeitada`)
      setShowRejectionDialog(false)
      setCompanyToReject(null)
      setRejectionReason('')
      loadData()
    } catch (error: any) {
      console.error('Erro ao rejeitar empresa:', error)
      toast.error('Erro ao rejeitar empresa: ' + error.message)
    }
  }

  const handleRejectDriver = async () => {
    if (!driverToReject || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório')
      return
    }

    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverToReject.id)

      if (error) throw error

      // Também atualizar na tabela user_registrations se existir
      await supabase
        .from('user_registrations')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('full_name', driverToReject.full_name)
        .eq('phone', driverToReject.phone)
        .eq('role', 'entregador')

      toast.success(`Entregador ${driverToReject.full_name} rejeitado`)
      setShowRejectionDialog(false)
      setDriverToReject(null)
      setRejectionReason('')
      loadData()
    } catch (error: any) {
      console.error('Erro ao rejeitar entregador:', error)
      toast.error('Erro ao rejeitar entregador: ' + error.message)
    }
  }

  const openUserRejectionDialog = (user: UserRegistration) => {
    setUserToReject(user)
    setCompanyToReject(null)
    setDriverToReject(null)
    setShowRejectionDialog(true)
  }

  const openCompanyRejectionDialog = (company: Company) => {
    setCompanyToReject(company)
    setUserToReject(null)
    setDriverToReject(null)
    setShowRejectionDialog(true)
  }

  const openDriverRejectionDialog = (driver: DeliveryDriver) => {
    setDriverToReject(driver)
    setUserToReject(null)
    setCompanyToReject(null)
    setShowRejectionDialog(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.company_name && user.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.responsible_name && user.responsible_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    
    return matchesSearch && matchesRole
  })

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.responsible_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.nif.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const filteredDrivers = deliveryDrivers.filter(driver => {
    const matchesSearch = 
      driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const getDisplayName = (user: UserRegistration) => {
    return user.full_name || user.company_name || user.responsible_name || user.email
  }

  const getDisplayInfo = (user: UserRegistration) => {
    switch (user.role) {
      case 'cliente':
        return `${user.age ? `${user.age} anos` : ''} • ${user.phone || 'Sem telefone'}`
      case 'empresa':
        return `${user.nif ? `NIF: ${user.nif}` : ''} • ${user.phone || 'Sem telefone'}`
      case 'entregador':
        return `${user.phone || 'Sem telefone'} • ${user.delivery_address ? 'Endereço cadastrado' : 'Sem endereço'}`
      case 'admin':
        return user.phone || 'Sem telefone'
      default:
        return user.email
    }
  }

  const UserDetailsDialog = () => (
    <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${roleConfig[selectedUser?.role || 'cliente'].color} rounded-full flex items-center justify-center`}>
              {(() => {
                const IconComponent = roleConfig[selectedUser?.role || 'cliente'].icon
                return IconComponent ? <IconComponent className="w-4 h-4 text-white" /> : null
              })()}
            </div>
            <span>Detalhes do Usuário</span>
          </DialogTitle>
        </DialogHeader>

        {selectedUser && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedUser.phone || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Tipo de Conta</Label>
                <Badge className={roleConfig[selectedUser.role].badgeColor}>
                  {roleConfig[selectedUser.role].title}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={statusConfig[selectedUser.status].color}>
                  {statusConfig[selectedUser.status].title}
                </Badge>
              </div>
            </div>

            {/* Informações Específicas por Role */}
            {selectedUser.role === 'cliente' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.full_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Idade</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.age ? `${selectedUser.age} anos` : 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.role === 'empresa' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Informações da Empresa</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome da Empresa</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.company_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.responsible_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">NIF</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.nif || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contactos</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.company_contacts || 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Morada</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.company_address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.role === 'entregador' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Informações do Entregador</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.full_name || 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.delivery_address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documentos */}
            {selectedUser.documents && selectedUser.documents.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Documentos Enviados</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedUser.documents.map((doc, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Documento {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Motivo da Rejeição */}
            {selectedUser.status === 'rejected' && selectedUser.rejection_reason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Motivo da Rejeição</Label>
                <p className="text-red-800 bg-red-50 p-3 rounded-lg">{selectedUser.rejection_reason}</p>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <Label className="text-sm font-medium text-gray-500">Cadastrado em</Label>
                <p>{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {selectedUser.updated_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p>{new Date(selectedUser.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            {selectedUser.status === 'pending' && (
              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={() => handleApproveUser(selectedUser)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowUserDetails(false)
                    openUserRejectionDialog(selectedUser)
                  }}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const CompanyDetailsDialog = () => (
    <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span>Detalhes da Empresa</span>
          </DialogTitle>
        </DialogHeader>

        {selectedCompany && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nome da Empresa</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCompany.company_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCompany.responsible_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCompany.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Contactos</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCompany.contacts}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">NIF</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCompany.nif}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={statusConfig[selectedCompany.status].color}>
                  {statusConfig[selectedCompany.status].title}
                </Badge>
              </div>
            </div>

            {/* Morada */}
            <div>
              <Label className="text-sm font-medium text-gray-500">Morada</Label>
              <p className="text-gray-900 dark:text-gray-100">{selectedCompany.address}</p>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Documentos</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedCompany.commercial_license_url && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => window.open(selectedCompany.commercial_license_url, '_blank')}
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Alvará Comercial</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                        <span>Clique para visualizar</span>
                      </div>
                    </div>
                  </Button>
                )}
                
                {selectedCompany.company_publication_url && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => window.open(selectedCompany.company_publication_url, '_blank')}
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Publicação da Empresa</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                        <span>Clique para visualizar</span>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </div>

            {/* Motivo da Rejeição */}
            {selectedCompany.status === 'rejected' && selectedCompany.rejection_reason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Motivo da Rejeição</Label>
                <p className="text-red-800 bg-red-50 p-3 rounded-lg">{selectedCompany.rejection_reason}</p>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <Label className="text-sm font-medium text-gray-500">Cadastrado em</Label>
                <p>{new Date(selectedCompany.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {selectedCompany.updated_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p>{new Date(selectedCompany.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            {selectedCompany.status === 'pending' && (
              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={() => handleApproveCompany(selectedCompany)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Empresa
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowCompanyDetails(false)
                    openCompanyRejectionDialog(selectedCompany)
                  }}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const DriverDetailsDialog = () => (
    <Dialog open={showDriverDetails} onOpenChange={setShowDriverDetails}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span>Detalhes do Entregador</span>
          </DialogTitle>
        </DialogHeader>

        {selectedDriver && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedDriver.full_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedDriver.phone}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                <p className="text-gray-900 dark:text-gray-100">{selectedDriver.address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={statusConfig[selectedDriver.status].color}>
                  {statusConfig[selectedDriver.status].title}
                </Badge>
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Documentos</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedDriver.identification_document_url && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => window.open(selectedDriver.identification_document_url, '_blank')}
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Documento de Identificação</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                        <span>Clique para visualizar</span>
                      </div>
                    </div>
                  </Button>
                )}
                
                {selectedDriver.driving_license_url && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => window.open(selectedDriver.driving_license_url, '_blank')}
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Carta de Condução</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                        <span>Clique para visualizar</span>
                      </div>
                    </div>
                  </Button>
                )}

                {selectedDriver.vehicle_photo_url && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => window.open(selectedDriver.vehicle_photo_url, '_blank')}
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span className="font-medium">Foto do Veículo</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                        <span>Clique para visualizar</span>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </div>

            {/* Motivo da Rejeição */}
            {selectedDriver.status === 'rejected' && selectedDriver.rejection_reason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Motivo da Rejeição</Label>
                <p className="text-red-800 bg-red-50 p-3 rounded-lg">{selectedDriver.rejection_reason}</p>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <Label className="text-sm font-medium text-gray-500">Cadastrado em</Label>
                <p>{new Date(selectedDriver.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {selectedDriver.updated_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p>{new Date(selectedDriver.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            {selectedDriver.status === 'pending' && (
              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={() => handleApproveDriver(selectedDriver)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Entregador
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDriverDetails(false)
                    openDriverRejectionDialog(selectedDriver)
                  }}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const RejectionDialog = () => (
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
              {userToReject ? getDisplayName(userToReject) : 
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
              onClick={userToReject ? handleRejectUser : companyToReject ? handleRejectCompany : handleRejectDriver}
              disabled={!rejectionReason.trim()}
              className="flex-1"
            >
              Rejeitar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie cadastros de clientes, empresas, entregadores e admins</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, email, empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pendentes</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="delivery-drivers" className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Entregadores</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger value="cliente" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="entregador" className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Usuários Entregadores</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Admins</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745] mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando dados...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Empresas */}
              {(activeTab === 'companies' || activeTab === 'pending' || activeTab === 'all') && (
                <>
                  {filteredCompanies.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>Empresas Cadastradas</span>
                      </h3>
                      {filteredCompanies.map((company) => {
                        const StatusIcon = statusConfig[company.status].icon
                        
                        return (
                          <Card key={company.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                      {company.company_name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {company.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Responsável: {company.responsible_name} • NIF: {company.nif}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <Badge className="bg-green-100 text-green-800">
                                    Empresa
                                  </Badge>
                                  <Badge className={statusConfig[company.status].color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig[company.status].title}
                                  </Badge>
                                  
                                  <div className="flex space-x-2">
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
                                          onClick={() => openCompanyRejectionDialog(company)}
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
                  )}
                </> 
              )}

              {/* Entregadores */}
              {(activeTab === 'delivery-drivers' || activeTab === 'pending' || activeTab === 'all') && (
                <>
                  {filteredDrivers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                        <Truck className="w-5 h-5" />
                        <span>Entregadores Cadastrados</span>
                      </h3>
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
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Entregador
                                  </Badge>
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
                                          onClick={() => openDriverRejectionDialog(driver)}
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
                  )}
                </>
              )}

              {/* Usuários */}
              {activeTab !== 'companies' && activeTab !== 'delivery-drivers' && (
                <>
                  {filteredUsers.length > 0 && (
                    <div className="space-y-4">
                      {(activeTab === 'pending' || activeTab === 'all') && (filteredCompanies.length > 0 || filteredDrivers.length > 0) && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                          <Users className="w-5 h-5" />
                          <span>Usuários Cadastrados</span>
                        </h3>
                      )}
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
                                      {getDisplayName(user)}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {user.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {getDisplayInfo(user)}
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
                                          onClick={() => openUserRejectionDialog(user)}
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
                  )}
                </>
              )}

              {/* Estado vazio */}
              {filteredUsers.length === 0 && filteredCompanies.length === 0 && filteredDrivers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UserDetailsDialog />
      <CompanyDetailsDialog />
      <DriverDetailsDialog />
      <RejectionDialog />
    </div>
  )
}

export { UserManagement }
export default UserManagement