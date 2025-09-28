'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface LocationData {
  country: string
  city: string
  countryCode: string
  detected: boolean
}

export interface CountryOption {
  code: string
  name: string
  cities: string[]
}

const AFRICAN_COUNTRIES: CountryOption[] = [
  {
    code: 'AO',
    name: 'Angola',
    cities: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe']
  },
  {
    code: 'MZ',
    name: 'Moçambique',
    cities: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete']
  },
  {
    code: 'CV',
    name: 'Cabo Verde',
    cities: ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Porto Novo', 'Espargos', 'Ribeira Grande']
  },
  {
    code: 'GW',
    name: 'Guiné-Bissau',
    cities: ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama', 'Cacheu', 'Farim']
  }
]

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    country: 'Angola',
    city: 'Luanda',
    countryCode: 'AO',
    detected: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detectar localização via IP
  const detectLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.reason || 'Erro ao detectar localização')
      }

      // Verificar se é um dos países africanos suportados
      const supportedCountry = AFRICAN_COUNTRIES.find(
        country => country.code === data.country_code
      )

      if (supportedCountry) {
        const newLocation: LocationData = {
          country: supportedCountry.name,
          city: data.city || supportedCountry.cities[0],
          countryCode: data.country_code,
          detected: true
        }
        
        setLocation(newLocation)
        await saveLocationToProfile(newLocation)
      } else {
        // País não suportado, usar Angola como padrão
        const defaultLocation: LocationData = {
          country: 'Angola',
          city: 'Luanda',
          countryCode: 'AO',
          detected: false
        }
        setLocation(defaultLocation)
      }
    } catch (err) {
      console.error('Erro ao detectar localização:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      
      // Usar localização padrão em caso de erro
      setLocation({
        country: 'Angola',
        city: 'Luanda',
        countryCode: 'AO',
        detected: false
      })
    } finally {
      setLoading(false)
    }
  }

  // Salvar localização no perfil do usuário
  const saveLocationToProfile = async (locationData: LocationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            country: locationData.country,
            city: locationData.city,
            country_code: locationData.countryCode,
            updated_at: new Date().toISOString()
          })
      }
    } catch (err) {
      console.error('Erro ao salvar localização no perfil:', err)
    }
  }

  // Carregar localização salva do perfil
  const loadSavedLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country, city, country_code')
          .eq('id', user.id)
          .single()

        if (profile && profile.country && profile.city) {
          setLocation({
            country: profile.country,
            city: profile.city,
            countryCode: profile.country_code || 'AO',
            detected: true
          })
          setLoading(false)
          return true
        }
      }
    } catch (err) {
      console.error('Erro ao carregar localização salva:', err)
    }
    return false
  }

  // Atualizar localização manualmente
  const updateLocation = async (country: string, city: string) => {
    const countryData = AFRICAN_COUNTRIES.find(c => c.name === country)
    if (!countryData) return

    const newLocation: LocationData = {
      country,
      city,
      countryCode: countryData.code,
      detected: false
    }

    setLocation(newLocation)
    await saveLocationToProfile(newLocation)
  }

  // Inicializar localização
  useEffect(() => {
    const initializeLocation = async () => {
      // Primeiro, tentar carregar localização salva
      const hasSavedLocation = await loadSavedLocation()
      
      // Se não houver localização salva, detectar via IP
      if (!hasSavedLocation) {
        await detectLocation()
      }
    }

    initializeLocation()
  }, [])

  return {
    location,
    loading,
    error,
    countries: AFRICAN_COUNTRIES,
    updateLocation,
    detectLocation
  }
}