"use client"

import { useState, useEffect } from 'react'
import { supabase, type Coupon } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Percent, Truck, Gift, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface CouponSystemProps {
  onCouponApplied: (coupon: Coupon | null) => void
  orderTotal: number
  appliedCoupon?: Coupon | null
}

export function CouponSystem({ onCouponApplied, orderTotal, appliedCoupon }: CouponSystemProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)

  useEffect(() => {
    loadAvailableCoupons()
  }, [])

  const loadAvailableCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCoupons(data || [])
    } catch (error) {
      console.error('Erro ao carregar cupons:', error)
    }
  }

  const applyCoupon = async (code: string) => {
    try {
      setLoading(true)

      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        toast.error('Cupom inválido ou expirado')
        return
      }

      // Verificar se o cupom ainda tem usos disponíveis
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error('Este cupom já atingiu o limite de usos')
        return
      }

      // Verificar valor mínimo do pedido
      if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
        toast.error(`Valor mínimo do pedido: ${coupon.min_order_value.toLocaleString()} Kz`)
        return
      }

      // Verificar data de expiração
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error('Este cupom já expirou')
        return
      }

      onCouponApplied(coupon)
      toast.success('Cupom aplicado com sucesso!')
      setCouponCode('')
      setShowCoupons(false)

    } catch (error) {
      console.error('Erro ao aplicar cupom:', error)
      toast.error('Erro ao aplicar cupom')
    } finally {
      setLoading(false)
    }
  }

  const removeCoupon = () => {
    onCouponApplied(null)
    toast.success('Cupom removido')
  }

  const calculateDiscount = (coupon: Coupon, total: number) => {
    switch (coupon.type) {
      case 'percentage':
        return Math.min((total * coupon.value) / 100, total)
      case 'fixed':
        return Math.min(coupon.value, total)
      case 'free_shipping':
        return 0 // O desconto do frete é calculado separadamente
      default:
        return 0
    }
  }

  const getCouponIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-5 h-5" />
      case 'fixed':
        return <Gift className="w-5 h-5" />
      case 'free_shipping':
        return <Truck className="w-5 h-5" />
      default:
        return <Gift className="w-5 h-5" />
    }
  }

  const getCouponDescription = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% de desconto`
      case 'fixed':
        return `${coupon.value.toLocaleString()} Kz de desconto`
      case 'free_shipping':
        return 'Frete grátis'
      default:
        return 'Desconto especial'
    }
  }

  return (
    <div className="space-y-4">
      {/* Cupom aplicado */}
      {appliedCoupon && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  {getCouponIcon(appliedCoupon.type)}
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {getCouponDescription(appliedCoupon)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeCoupon}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aplicar cupom */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Digite o código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              onClick={() => applyCoupon(couponCode)}
              disabled={!couponCode || loading}
              className="bg-[#28a745] hover:bg-[#1e7e34]"
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>

          <Dialog open={showCoupons} onOpenChange={setShowCoupons}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Ver cupons disponíveis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cupons Disponíveis</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {coupons.map((coupon) => {
                  const canUse = (!coupon.min_order_value || orderTotal >= coupon.min_order_value) &&
                                (!coupon.max_uses || coupon.used_count < coupon.max_uses) &&
                                (!coupon.expires_at || new Date(coupon.expires_at) > new Date())

                  return (
                    <Card 
                      key={coupon.id} 
                      className={`cursor-pointer transition-all ${
                        canUse 
                          ? 'hover:shadow-md border-green-200' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => canUse && applyCoupon(coupon.code)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            canUse 
                              ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {getCouponIcon(coupon.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold">{coupon.code}</p>
                              {canUse && (
                                <Badge className="bg-green-100 text-green-800">
                                  Disponível
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {getCouponDescription(coupon)}
                            </p>
                            {coupon.min_order_value && (
                              <p className="text-xs text-gray-500">
                                Mín: {coupon.min_order_value.toLocaleString()} Kz
                              </p>
                            )}
                            {coupon.expires_at && (
                              <p className="text-xs text-gray-500">
                                Válido até: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {coupons.length === 0 && (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Nenhum cupom disponível no momento</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

// Hook para calcular desconto
export const useCouponDiscount = (coupon: Coupon | null, orderTotal: number, deliveryFee: number) => {
  if (!coupon) return { discount: 0, freeShipping: false }

  let discount = 0
  let freeShipping = false

  switch (coupon.type) {
    case 'percentage':
      discount = Math.min((orderTotal * coupon.value) / 100, orderTotal)
      break
    case 'fixed':
      discount = Math.min(coupon.value, orderTotal)
      break
    case 'free_shipping':
      freeShipping = true
      break
  }

  return { discount, freeShipping }
}