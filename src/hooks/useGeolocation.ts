import { useState, useEffect } from 'react'
import { getCurrentLocation } from '@/lib/utils'

export interface LocationData {
  lat: number
  lng: number
  address?: string
  error?: string
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords
      
      // Aqui você pode usar uma API de geocoding reverso para obter o endereço
      setLocation({
        lat: latitude,
        lng: longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter localização'
      setError(errorMessage)
      setLocation({
        lat: -8.8390, // Luanda como padrão
        lng: 13.2894,
        address: 'Luanda, Angola',
        error: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  return { location, loading, error, refetch: getLocation }
}