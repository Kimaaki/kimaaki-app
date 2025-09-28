"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Crown,
  Star,
  Truck,
  Package,
  TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CompanyRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (companyData: any) => void
}

interface CompanyFormData {
  companyName: string
  responsibleName: string
  nif: string
  address: string
  contacts: string
  email: string
  plan: 'basic' | 'premium'
  commercialLicense: File | null
  companyPublication: File | null
}

const planDetails = {
  basic: {
    name: 'Plano Básico',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    features: [
      'Comissão: 15% (entregadores da plataforma)',
      'Comissão: 8% (self-delivery)',
      'Comissão: 5% (retirada/pickup)',
      'Visibilidade padrão no aplicativo'
    ],
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
    features: [
      'Comissão: 20% (entregadores da plataforma)',
      'Comissão: 12% (self-delivery)',
      'Comissão: 8% (retirada/pickup)',
      'Destaque nos resultados de busca',
      'Aparecer na seção "Recomendados"',
      'Participação em campanhas de marketing'
    ],
    commissions: {
      platform_delivery: 20,
      self_delivery: 12,
      pickup: 8
    }
  }
}

export function CompanyRegistration({ isOpen, onClose, onSuccess }: CompanyRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    responsibleName: '',
    nif: '',
    address: '',
    contacts: '',
    email: '',
    plan: 'basic',
    commercialLicense: null,
    companyPublication: null
  })

  const totalSteps = 4 // Adicionamos uma etapa para seleção de plano
  const progress = (currentStep / totalSteps) * 100

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.responsibleName && formData.email)
      case 2:
        return !!(formData.nif && formData.address && formData.contacts)
      case 3:
        return !!formData.plan
      case 4:
        return !!(formData.commercialLicense && formData.companyPublication)
      default:
        return false
    }
  }

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (field: 'commercialLicense' | 'companyPublication', file: File | null) => {
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Apenas arquivos JPG, PNG ou PDF são permitidos')
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo deve ter no máximo 5MB')
        return
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: file
    }))
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('company-documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      // Upload dos documentos
      let commercialLicenseUrl = null
      let companyPublicationUrl = null

      if (formData.commercialLicense) {
        commercialLicenseUrl = await uploadFile(formData.commercialLicense, 'commercial-licenses')
        if (!commercialLicenseUrl) {
          throw new Error('Erro ao fazer upload do Alvará Comercial')
        }
      }

      if (formData.companyPublication) {
        companyPublicationUrl = await uploadFile(formData.companyPublication, 'company-publications')
        if (!companyPublicationUrl) {
          throw new Error('Erro ao fazer upload da Publicação da Empresa')
        }
      }

      // Salvar dados da empresa no banco
      const companyData = {
        company_name: formData.companyName,
        responsible_name: formData.responsibleName,
        nif: formData.nif,
        address: formData.address,
        contacts: formData.contacts,
        email: formData.email,
        plan: formData.plan,
        commercial_license_url: commercialLicenseUrl,
        company_publication_url: companyPublicationUrl,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Também criar registro na tabela user_registrations para compatibilidade
      const userRegistrationData = {
        email: formData.email,
        role: 'empresa' as const,
        status: 'pending' as const,
        phone: formData.contacts,
        company_name: formData.companyName,
        responsible_name: formData.responsibleName,
        nif: formData.nif,
        company_address: formData.address,
        company_contacts: formData.contacts,
        documents: [commercialLicenseUrl, companyPublicationUrl].filter(Boolean)
      }

      await supabase
        .from('user_registrations')
        .insert(userRegistrationData)

      toast.success('Cadastro de empresa enviado com sucesso! Aguarde a aprovação do administrador.')
      onSuccess(data)
      onClose()
      
      // Reset form
      setFormData({
        companyName: '',
        responsibleName: '',
        nif: '',
        address: '',
        contacts: '',
        email: '',
        plan: 'basic',
        commercialLicense: null,
        companyPublication: null
      })
      setCurrentStep(1)

    } catch (error: any) {
      console.error('Erro ao cadastrar empresa:', error)
      toast.error('Erro ao cadastrar empresa: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast.error('Por favor, preencha todos os campos obrigatórios')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Informações Básicas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dados principais da sua empresa
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Nome da Empresa *</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Digite o nome da empresa"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="responsibleName" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nome do Responsável *</span>
                </Label>
                <Input
                  id="responsibleName"
                  placeholder="Digite o nome do responsável"
                  value={formData.responsibleName}
                  onChange={(e) => handleInputChange('responsibleName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email da Empresa *</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dados Legais
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Informações legais e de contato
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nif" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>NIF (Número de Identificação Fiscal) *</span>
                </Label>
                <Input
                  id="nif"
                  placeholder="Digite o NIF da empresa"
                  value={formData.nif}
                  onChange={(e) => handleInputChange('nif', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Morada Completa *</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="Digite a morada completa da empresa"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contacts" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Contactos *</span>
                </Label>
                <Input
                  id="contacts"
                  placeholder="Telefone, WhatsApp, etc."
                  value={formData.contacts}
                  onChange={(e) => handleInputChange('contacts', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Escolha seu Plano
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecione o plano que melhor atende às suas necessidades
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(planDetails).map(([planKey, plan]) => {
                const PlanIcon = plan.icon
                const isSelected = formData.plan === planKey
                
                return (
                  <Card 
                    key={planKey}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-[#28a745] border-[#28a745] shadow-lg' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, plan: planKey as 'basic' | 'premium' }))}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            planKey === 'premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-blue-500'
                          }`}>
                            <PlanIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            {planKey === 'premium' && (
                              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Recomendado
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-[#28a745]" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Informação sobre Comissões:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    As comissões são calculadas automaticamente em cada pedido. 
                    Você pode alterar seu plano posteriormente através do painel administrativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Upload className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Documentos Obrigatórios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envie os documentos necessários (JPG, PNG ou PDF)
              </p>
            </div>

            <div className="space-y-6">
              {/* Alvará Comercial */}
              <div>
                <Label className="flex items-center space-x-2 mb-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Alvará Comercial *</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('commercialLicense', e.target.files?.[0] || null)}
                    className="hidden"
                    id="commercial-license"
                  />
                  <label
                    htmlFor="commercial-license"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {formData.commercialLicense ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {formData.commercialLicense.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Clique para alterar
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para enviar o Alvará Comercial
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG ou PDF (máx. 5MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Publicação da Empresa */}
              <div>
                <Label className="flex items-center space-x-2 mb-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Publicação da Empresa *</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('companyPublication', e.target.files?.[0] || null)}
                    className="hidden"
                    id="company-publication"
                  />
                  <label
                    htmlFor="company-publication"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {formData.companyPublication ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {formData.companyPublication.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Clique para alterar
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para enviar a Publicação da Empresa
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG ou PDF (máx. 5MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Importante:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Seu cadastro será analisado pela equipe administrativa. 
                      Você receberá uma notificação quando for aprovado ou se precisar de ajustes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-[#28a745]" />
              <span>Cadastro de Empresa</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Etapa {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>

            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="bg-[#28a745] hover:bg-[#1e7e34]"
                  disabled={!validateStep(currentStep)}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-[#28a745] hover:bg-[#1e7e34]"
                  disabled={loading || !validateStep(currentStep)}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}