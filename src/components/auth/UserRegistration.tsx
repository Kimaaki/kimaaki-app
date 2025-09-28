"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Building2, Truck, Shield, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UserRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
}

type UserRole = 'cliente' | 'empresa' | 'entregador' | 'admin'

interface RegistrationData {
  role: UserRole
  // Campos comuns
  email: string
  password: string
  phone: string
  
  // Cliente
  full_name?: string
  address?: string
  age?: number
  
  // Empresa
  company_name?: string
  responsible_name?: string
  nif?: string
  company_address?: string
  company_contacts?: string
  
  // Entregador
  delivery_address?: string
  
  // Documentos
  documents?: File[]
}

export function UserRegistration({ isOpen, onClose, onSuccess }: UserRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('cliente')
  const [formData, setFormData] = useState<RegistrationData>({
    role: 'cliente',
    email: '',
    password: '',
    phone: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const roleConfig = {
    cliente: {
      title: 'Cliente',
      description: 'Usuário normal que faz pedidos',
      icon: User,
      color: 'bg-blue-500',
      fields: ['full_name', 'phone', 'address', 'age'],
      requiredDocs: [],
      autoApprove: true
    },
    empresa: {
      title: 'Empresa',
      description: 'Restaurante, Supermercado, Farmácia, Loja',
      icon: Building2,
      color: 'bg-green-500',
      fields: ['company_name', 'responsible_name', 'nif', 'company_address', 'company_contacts'],
      requiredDocs: ['Alvará Comercial', 'Publicação da Empresa'],
      autoApprove: false
    },
    entregador: {
      title: 'Entregador',
      description: 'Delivery Man',
      icon: Truck,
      color: 'bg-orange-500',
      fields: ['full_name', 'phone', 'delivery_address'],
      requiredDocs: ['Documento de Identificação (BI/Passaporte)', 'Carta de Condução'],
      optionalDocs: ['Foto do Veículo'],
      autoApprove: false
    },
    admin: {
      title: 'Administrador',
      description: 'Gestor do App',
      icon: Shield,
      color: 'bg-red-500',
      fields: ['full_name', 'phone'],
      requiredDocs: [],
      autoApprove: false
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Arquivo ${file.name} tem formato inválido. Use JPG, PNG ou PDF.`)
        return false
      }
      
      if (file.size > maxSize) {
        toast.error(`Arquivo ${file.name} é muito grande. Máximo 5MB.`)
        return false
      }
      
      return true
    })
    
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadDocuments = async (userId: string) => {
    const uploadPromises = uploadedFiles.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}_${selectedRole}_doc_${index + 1}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file)
      
      if (error) throw error
      return data.path
    })
    
    return Promise.all(uploadPromises)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validar campos obrigatórios
      const config = roleConfig[selectedRole]
      const requiredFields = ['email', 'password', ...config.fields]
      
      for (const field of requiredFields) {
        if (!formData[field as keyof RegistrationData]) {
          toast.error(`Campo ${field} é obrigatório`)
          return
        }
      }

      // Validar documentos obrigatórios
      if (config.requiredDocs.length > 0 && uploadedFiles.length < config.requiredDocs.length) {
        toast.error(`Você deve enviar ${config.requiredDocs.length} documento(s) obrigatório(s)`)
        return
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: selectedRole,
            full_name: formData.full_name || formData.responsible_name || '',
            phone: formData.phone
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // Upload de documentos (se houver)
      let documentPaths: string[] = []
      if (uploadedFiles.length > 0) {
        documentPaths = await uploadDocuments(authData.user.id)
      }

      // Criar registro na tabela user_registrations
      const registrationData = {
        id: authData.user.id,
        email: formData.email,
        role: selectedRole,
        status: config.autoApprove ? 'approved' : 'pending',
        
        // Dados específicos por role
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        age: formData.age,
        
        company_name: formData.company_name,
        responsible_name: formData.responsible_name,
        nif: formData.nif,
        company_address: formData.company_address,
        company_contacts: formData.company_contacts,
        
        delivery_address: formData.delivery_address,
        
        documents: documentPaths,
        created_at: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('user_registrations')
        .insert(registrationData)

      if (dbError) throw dbError

      // Sucesso
      toast.success(
        config.autoApprove 
          ? 'Cadastro realizado com sucesso!' 
          : 'Cadastro enviado! Aguarde aprovação do administrador.'
      )

      onSuccess({
        ...authData.user,
        role: selectedRole,
        status: config.autoApprove ? 'approved' : 'pending'
      })
      
      onClose()

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      toast.error('Erro ao realizar cadastro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Escolha o tipo de conta
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecione a categoria que melhor descreve você
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon
          const isSelected = selectedRole === role
          
          return (
            <Card
              key={role}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-[#28a745] bg-green-50 dark:bg-green-900/20' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedRole(role as UserRole)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {config.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {config.description}
                </p>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-[#28a745] mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6">
        <Button 
          onClick={() => setCurrentStep(2)}
          className="w-full bg-[#28a745] hover:bg-[#1e7e34]"
          disabled={!selectedRole}
        >
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderFormFields = () => {
    const config = roleConfig[selectedRole]
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center`}>
              <config.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Cadastro - {config.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Preencha os dados obrigatórios
              </p>
            </div>
          </div>
          <Badge variant={config.autoApprove ? "default" : "secondary"}>
            {config.autoApprove ? 'Aprovação Automática' : 'Aprovação Manual'}
          </Badge>
        </div>

        {/* Campos comuns */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Sua senha"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+244 900 000 000"
            />
          </div>
        </div>

        {/* Campos específicos por role */}
        {selectedRole === 'cliente' && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Endereço *</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Seu endereço completo"
              />
            </div>
            
            <div>
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                placeholder="Sua idade"
                min="18"
              />
            </div>
          </div>
        )}

        {selectedRole === 'empresa' && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="responsible_name">Nome do Responsável *</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name || ''}
                onChange={(e) => setFormData({...formData, responsible_name: e.target.value})}
                placeholder="Nome do responsável"
              />
            </div>
            
            <div>
              <Label htmlFor="nif">NIF *</Label>
              <Input
                id="nif"
                value={formData.nif || ''}
                onChange={(e) => setFormData({...formData, nif: e.target.value})}
                placeholder="Número de Identificação Fiscal"
              />
            </div>
            
            <div>
              <Label htmlFor="company_address">Morada *</Label>
              <Textarea
                id="company_address"
                value={formData.company_address || ''}
                onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                placeholder="Endereço da empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="company_contacts">Contactos *</Label>
              <Textarea
                id="company_contacts"
                value={formData.company_contacts || ''}
                onChange={(e) => setFormData({...formData, company_contacts: e.target.value})}
                placeholder="Telefones, emails, etc."
              />
            </div>
          </div>
        )}

        {selectedRole === 'entregador' && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <Label htmlFor="delivery_address">Endereço *</Label>
              <Textarea
                id="delivery_address"
                value={formData.delivery_address || ''}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                placeholder="Seu endereço completo"
              />
            </div>
          </div>
        )}

        {selectedRole === 'admin' && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button 
            onClick={() => setCurrentStep(3)}
            className="flex-1 bg-[#28a745] hover:bg-[#1e7e34]"
          >
            {config.requiredDocs.length > 0 ? 'Enviar Documentos' : 'Finalizar'}
          </Button>
        </div>
      </div>
    )
  }

  const renderDocumentUpload = () => {
    const config = roleConfig[selectedRole]
    
    if (config.requiredDocs.length === 0) {
      return null
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload de Documentos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envie os documentos obrigatórios (JPG, PNG, PDF - máx. 5MB)
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Documentos Obrigatórios:
            </Label>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
              {config.requiredDocs.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </div>

          {config.optionalDocs && (
            <div>
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Documentos Opcionais:
              </Label>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                {config.optionalDocs.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Clique para selecionar arquivos ou arraste aqui
          </p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Selecionar Arquivos
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Arquivos Selecionados:</Label>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-900 dark:text-gray-100">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(2)}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || uploadedFiles.length < config.requiredDocs.length}
            className="flex-1 bg-[#28a745] hover:bg-[#1e7e34]"
          >
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cadastro KIMAAKI</span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    step <= currentStep ? 'bg-[#28a745]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {currentStep === 1 && renderRoleSelection()}
          {currentStep === 2 && renderFormFields()}
          {currentStep === 3 && renderDocumentUpload()}
        </div>
      </DialogContent>
    </Dialog>
  )
}