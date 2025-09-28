"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Crown, 
  Package, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Truck, 
  ShoppingBag,
  Megaphone
} from 'lucide-react'

interface PlanComparisonProps {
  onSelectPlan?: (plan: 'basic' | 'premium') => void
  selectedPlan?: 'basic' | 'premium'
  showSelection?: boolean
}

const planDetails = {
  basic: {
    name: 'Plano Básico',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    price: 'Gratuito',
    features: [
      {
        icon: Truck,
        title: 'Comissão: 15%',
        description: 'Entregadores da plataforma'
      },
      {
        icon: ShoppingBag,
        title: 'Comissão: 8%',
        description: 'Self-delivery'
      },
      {
        icon: Package,
        title: 'Comissão: 5%',
        description: 'Retirada/pickup'
      },
      {
        icon: CheckCircle,
        title: 'Visibilidade padrão',
        description: 'Aparecer nos resultados normais'
      }
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
    price: 'Personalizado',
    features: [
      {
        icon: Truck,
        title: 'Comissão: 20%',
        description: 'Entregadores da plataforma'
      },
      {
        icon: ShoppingBag,
        title: 'Comissão: 12%',
        description: 'Self-delivery'
      },
      {
        icon: Package,
        title: 'Comissão: 8%',
        description: 'Retirada/pickup'
      },
      {
        icon: Star,
        title: 'Destaque nos resultados',
        description: 'Aparecer no topo das buscas'
      },
      {
        icon: TrendingUp,
        title: 'Seção "Recomendados"',
        description: 'Destaque na página inicial'
      },
      {
        icon: Megaphone,
        title: 'Campanhas de marketing',
        description: 'Participação em promoções especiais'
      }
    ],
    commissions: {
      platform_delivery: 20,
      self_delivery: 12,
      pickup: 8
    }
  }
}

export function PlanComparison({ onSelectPlan, selectedPlan, showSelection = false }: PlanComparisonProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Escolha o Plano Ideal para sua Empresa
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Compare nossos planos e escolha o que melhor se adapta ao seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {Object.entries(planDetails).map(([planKey, plan]) => {
          const PlanIcon = plan.icon
          const isSelected = selectedPlan === planKey
          const isPremium = planKey === 'premium'
          
          return (
            <Card 
              key={planKey}
              className={`relative transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-[#28a745] border-[#28a745] shadow-lg' 
                  : 'hover:shadow-md border-gray-200'
              } ${isPremium ? 'border-purple-200' : ''}`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isPremium ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-blue-500'
                    }`}>
                      <PlanIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{plan.price}</p>
                    </div>
                  </div>
                  {isSelected && showSelection && (
                    <CheckCircle className="w-6 h-6 text-[#28a745]" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => {
                    const FeatureIcon = feature.icon
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPremium ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <FeatureIcon className={`w-4 h-4 ${
                            isPremium ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {feature.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {showSelection && onSelectPlan && (
                  <Button
                    onClick={() => onSelectPlan(planKey as 'basic' | 'premium')}
                    className={`w-full mt-4 ${
                      isPremium 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isSelected ? 'Plano Selecionado' : `Escolher ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg max-w-4xl mx-auto">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Como funcionam as comissões?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <Truck className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium">Entregadores da Plataforma</p>
              <p className="text-gray-600 dark:text-gray-400">
                Quando usar nossos entregadores
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <ShoppingBag className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Self-Delivery</p>
              <p className="text-gray-600 dark:text-gray-400">
                Quando você faz a entrega
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Package className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Retirada/Pickup</p>
              <p className="text-gray-600 dark:text-gray-400">
                Cliente retira no local
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}