'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface LocalPaymentMethod {
  id: string
  country: string
  method: string
  instructions: string
  icon?: string
  isActive: boolean
}

export interface PaymentMethodsByCountry {
  [countryCode: string]: LocalPaymentMethod[]
}

export function useLocalPayments() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsByCountry>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar métodos de pagamento do Supabase
  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('local_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('country', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }

      // Agrupar por país
      const methodsByCountry: PaymentMethodsByCountry = {}
      data?.forEach(method => {
        const countryCode = getCountryCode(method.country)
        if (!methodsByCountry[countryCode]) {
          methodsByCountry[countryCode] = []
        }
        methodsByCountry[countryCode].push({
          id: method.id,
          country: method.country,
          method: method.method,
          instructions: method.instructions,
          icon: method.icon,
          isActive: method.is_active
        })
      })

      setPaymentMethods(methodsByCountry)
    } catch (err) {
      console.error('Erro ao carregar métodos de pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      
      // Usar métodos padrão em caso de erro
      setPaymentMethods(getDefaultPaymentMethods())
    } finally {
      setLoading(false)
    }
  }

  // Obter métodos de pagamento para um país específico
  const getPaymentMethodsForCountry = (countryCode: string): LocalPaymentMethod[] => {
    return paymentMethods[countryCode] || []
  }

  // Salvar método de pagamento preferido do usuário
  const savePreferredPaymentMethod = async (methodId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            preferred_payment_method: methodId,
            updated_at: new Date().toISOString()
          })
      }
    } catch (err) {
      console.error('Erro ao salvar método de pagamento preferido:', err)
    }
  }

  // Carregar método de pagamento preferido do usuário
  const loadPreferredPaymentMethod = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_payment_method')
          .eq('id', user.id)
          .single()

        return profile?.preferred_payment_method || null
      }
    } catch (err) {
      console.error('Erro ao carregar método de pagamento preferido:', err)
    }
    return null
  }

  // Registrar pagamento escolhido
  const registerPayment = async (orderId: string, methodId: string, amount: number) => {
    try {
      const method = Object.values(paymentMethods)
        .flat()
        .find(m => m.id === methodId)

      if (!method) {
        throw new Error('Método de pagamento não encontrado')
      }

      const { error } = await supabase
        .from('order_payments')
        .insert({
          order_id: orderId,
          payment_method_id: methodId,
          payment_method_name: method.method,
          amount: amount,
          status: 'pending',
          instructions: method.instructions,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      return {
        success: true,
        method: method.method,
        instructions: method.instructions
      }
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err)
      throw err
    }
  }

  // Inicializar dados
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  return {
    paymentMethods,
    loading,
    error,
    getPaymentMethodsForCountry,
    savePreferredPaymentMethod,
    loadPreferredPaymentMethod,
    registerPayment,
    reloadPaymentMethods: loadPaymentMethods
  }
}

// Função auxiliar para obter código do país
function getCountryCode(countryName: string): string {
  const countryMap: { [key: string]: string } = {
    'Angola': 'AO',
    'Moçambique': 'MZ',
    'Cabo Verde': 'CV',
    'Guiné-Bissau': 'GW'
  }
  return countryMap[countryName] || 'AO'
}

// Métodos de pagamento padrão (fallback)
function getDefaultPaymentMethods(): PaymentMethodsByCountry {
  return {
    'AO': [
      {
        id: 'ao-multicaixa',
        country: 'Angola',
        method: 'Multicaixa Express',
        instructions: 'Use a referência fornecida para pagar via Multicaixa Express em qualquer terminal ou app.',
        icon: '💳',
        isActive: true
      },
      {
        id: 'ao-transfer',
        country: 'Angola',
        method: 'Transferência Bancária',
        instructions: 'Faça a transferência para a conta indicada e envie o comprovativo.',
        icon: '🏦',
        isActive: true
      }
    ],
    'MZ': [
      {
        id: 'mz-mpesa',
        country: 'Moçambique',
        method: 'M-Pesa',
        instructions: 'Envie o valor para o número M-Pesa configurado: *150*00#',
        icon: '📱',
        isActive: true
      },
      {
        id: 'mz-emola',
        country: 'Moçambique',
        method: 'e-Mola',
        instructions: 'Use o app e-Mola para enviar o pagamento para o número indicado.',
        icon: '💰',
        isActive: true
      }
    ],
    'CV': [
      {
        id: 'cv-bcv',
        country: 'Cabo Verde',
        method: 'BCV Mobile',
        instructions: 'Use o BCV Mobile para fazer a transferência para a conta indicada.',
        icon: '📱',
        isActive: true
      },
      {
        id: 'cv-transfer',
        country: 'Cabo Verde',
        method: 'Transferência Bancária',
        instructions: 'Faça a transferência bancária e envie o comprovativo.',
        icon: '🏦',
        isActive: true
      }
    ],
    'GW': [
      {
        id: 'gw-mobile',
        country: 'Guiné-Bissau',
        method: 'Pagamento Móvel',
        instructions: 'Use o serviço de pagamento móvel da sua operadora.',
        icon: '📱',
        isActive: true
      },
      {
        id: 'gw-transfer',
        country: 'Guiné-Bissau',
        method: 'Transferência Bancária',
        instructions: 'Faça a transferência para a conta bancária indicada.',
        icon: '🏦',
        isActive: true
      }
    ]
  }
}