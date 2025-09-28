'use client'

import { Star, Clock, MapPin } from 'lucide-react'
import { Restaurant } from '@/lib/types'

interface RestaurantCardProps {
  restaurant: Restaurant
  onSelect: (restaurant: Restaurant) => void
}

export function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
      onClick={() => onSelect(restaurant)}
    >
      <div className="relative h-48">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{restaurant.rating}</span>
        </div>
        {restaurant.isPromoted && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Destaque
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{restaurant.category}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{restaurant.deliveryTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{restaurant.distance} km</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Taxa de entrega</span>
          <span className="font-medium text-gray-900">
            {restaurant.deliveryFee === 0 ? 'Grátis' : `${restaurant.deliveryFee} Kz`}
          </span>
        </div>
      </div>
    </div>
  )
}