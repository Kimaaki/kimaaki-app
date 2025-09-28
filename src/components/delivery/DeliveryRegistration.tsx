"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Truck, 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  AlertCircle,
  User,
  Phone,
  MapPin,
  FileCheck,
  Car
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeliveryRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (deliveryData: any) => void
}

interface DeliveryFormData {
  fullName: string
  phone: string
  address: string
  identificationDocument: File | null
  drivingLicense: File | null
  vehiclePhoto: File | null
}

export function DeliveryRegistration({ isOpen, onClose, onSuccess }: DeliveryRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<DeliveryFormData>({
    fullName: '',
    phone: '',
    address: '',
    identificationDocument: null,
    drivingLicense: null,
    vehiclePhoto: null
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.phone)
      case 2:
        return !!(formData.address)
      case 3:
        return !!(formData.identificationDocument && formData.drivingLicense)
      default:
        return false
    }
  }

  const handleInputChange = (field: keyof DeliveryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (field: 'identificationDocument' | 'drivingLicense' | 'vehiclePhoto', file: File | null) => {
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
        .from('delivery-documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('delivery-documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      // Upload dos documentos obrigatórios
      let identificationDocumentUrl = null
      let drivingLicenseUrl = null
      let vehiclePhotoUrl = null

      if (formData.identificationDocument) {
        identificationDocumentUrl = await uploadFile(formData.identificationDocument, 'identification-documents')
        if (!identificationDocumentUrl) {
          throw new Error('Erro ao fazer upload do Documento de Identificação')
        }
      }

      if (formData.drivingLicense) {
        drivingLicenseUrl = await uploadFile(formData.drivingLicense, 'driving-licenses')
        if (!drivingLicenseUrl) {
          throw new Error('Erro ao fazer upload da Carta de Condução')
        }
      }

      // Upload da foto do veículo (opcional)
      if (formData.vehiclePhoto) {
        vehiclePhotoUrl = await uploadFile(formData.vehiclePhoto, 'vehicle-photos')
      }

      // Criar registro na tabela user_registrations
      const userRegistrationData = {
        email: `${formData.phone}@entregador.temp`, // Email temporário baseado no telefone
        role: 'entregador' as const,
        status: 'pending' as const,
        phone: formData.phone,
        full_name: formData.fullName,
        delivery_address: formData.address,
        documents: [identificationDocumentUrl, drivingLicenseUrl, vehiclePhotoUrl].filter(Boolean)
      }

      const { data, error } = await supabase
        .from('user_registrations')
        .insert(userRegistrationData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Também criar registro na tabela delivery_drivers para dados específicos
      const deliveryDriverData = {
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        identification_document_url: identificationDocumentUrl,
        driving_license_url: drivingLicenseUrl,
        vehicle_photo_url: vehiclePhotoUrl,
        status: 'pending'
      }

      await supabase
        .from('delivery_drivers')
        .insert(deliveryDriverData)

      toast.success('Cadastro de entregador enviado com sucesso! Aguarde a aprovação do administrador.')
      onSuccess(data)
      onClose()
      
      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        address: '',
        identificationDocument: null,
        drivingLicense: null,
        vehiclePhoto: null
      })
      setCurrentStep(1)

    } catch (error: any) {
      console.error('Erro ao cadastrar entregador:', error)
      toast.error('Erro ao cadastrar entregador: ' + (error.message || 'Erro desconhecido'))
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
              <Truck className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Informações Pessoais
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dados básicos do entregador
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nome Completo *</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Digite seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telefone *</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="Digite seu número de telefone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
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
              <MapPin className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Endereço
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Onde você reside
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Endereço Completo *</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="Digite seu endereço completo (rua, bairro, cidade)"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Upload className="w-12 h-12 mx-auto mb-3 text-[#28a745]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Documentos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envie os documentos necessários (JPG, PNG ou PDF)
              </p>
            </div>

            <div className="space-y-6">
              {/* Documento de Identificação */}
              <div>
                <Label className="flex items-center space-x-2 mb-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Documento de Identificação (BI ou Passaporte) *</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('identificationDocument', e.target.files?.[0] || null)}
                    className="hidden"
                    id="identification-document"
                  />
                  <label
                    htmlFor="identification-document"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {formData.identificationDocument ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {formData.identificationDocument.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Clique para alterar
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para enviar o Documento de Identificação
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG ou PDF (máx. 5MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Carta de Condução */}
              <div>
                <Label className="flex items-center space-x-2 mb-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Carta de Condução *</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('drivingLicense', e.target.files?.[0] || null)}
                    className="hidden"
                    id="driving-license"
                  />
                  <label
                    htmlFor="driving-license"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {formData.drivingLicense ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {formData.drivingLicense.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Clique para alterar
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para enviar a Carta de Condução
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG ou PDF (máx. 5MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Foto do Veículo (Opcional) */}
              <div>
                <Label className="flex items-center space-x-2 mb-2">
                  <Car className="w-4 h-4" />
                  <span>Foto do Veículo (Opcional)</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('vehiclePhoto', e.target.files?.[0] || null)}
                    className="hidden"
                    id="vehicle-photo"
                  />
                  <label
                    htmlFor="vehicle-photo"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {formData.vehiclePhoto ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {formData.vehiclePhoto.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Clique para alterar
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para enviar a Foto do Veículo
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG ou PDF (máx. 5MB) - Opcional
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
              <Truck className="w-6 h-6 text-[#28a745]" />
              <span>Cadastro de Entregador</span>
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