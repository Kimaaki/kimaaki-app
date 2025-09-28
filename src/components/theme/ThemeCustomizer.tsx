"use client"

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, Monitor, Palette, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface ThemeCustomizerProps {
  onClose?: () => void
}

export function ThemeCustomizer({ onClose }: ThemeCustomizerProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accentColor, setAccentColor] = useState('#28a745')
  const [fontSize, setFontSize] = useState('medium')
  const [animations, setAnimations] = useState(true)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carregar preferências salvas
  useEffect(() => {
    if (mounted) {
      const savedAccentColor = localStorage.getItem('accent-color')
      const savedFontSize = localStorage.getItem('font-size')
      const savedAnimations = localStorage.getItem('animations')

      if (savedAccentColor) setAccentColor(savedAccentColor)
      if (savedFontSize) setFontSize(savedFontSize)
      if (savedAnimations) setAnimations(savedAnimations === 'true')
    }
  }, [mounted])

  // Aplicar mudanças de tema
  useEffect(() => {
    if (mounted) {
      // Aplicar cor de destaque
      document.documentElement.style.setProperty('--accent-color', accentColor)
      localStorage.setItem('accent-color', accentColor)

      // Aplicar tamanho da fonte
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }
      document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize as keyof typeof fontSizeMap])
      localStorage.setItem('font-size', fontSize)

      // Aplicar animações
      document.documentElement.style.setProperty('--animations', animations ? 'all' : 'none')
      localStorage.setItem('animations', animations.toString())
    }
  }, [accentColor, fontSize, animations, mounted])

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ]

  const accentColors = [
    { name: 'Verde KIMAAKI', value: '#28a745' },
    { name: 'Azul', value: '#007bff' },
    { name: 'Roxo', value: '#6f42c1' },
    { name: 'Rosa', value: '#e83e8c' },
    { name: 'Laranja', value: '#fd7e14' },
    { name: 'Vermelho', value: '#dc3545' },
    { name: 'Ciano', value: '#17a2b8' },
    { name: 'Amarelo', value: '#ffc107' }
  ]

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast.success(`Tema alterado para ${themeOptions.find(t => t.value === newTheme)?.label}`)
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    toast.success('Cor de destaque alterada')
  }

  const resetToDefaults = () => {
    setTheme('system')
    setAccentColor('#28a745')
    setFontSize('medium')
    setAnimations(true)
    
    // Limpar localStorage
    localStorage.removeItem('accent-color')
    localStorage.removeItem('font-size')
    localStorage.removeItem('animations')
    
    toast.success('Configurações restauradas para o padrão')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a745]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-6 h-6 text-[#28a745]" />
          <h1 className="text-2xl font-bold">Personalizar Tema</h1>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Tema Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tema Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center gap-2 ${
                    isActive ? 'bg-[#28a745] hover:bg-[#1e7e34]' : ''
                  }`}
                  onClick={() => handleThemeChange(option.value)}
                >
                  <Icon className="w-6 h-6" />
                  <span>{option.label}</span>
                  {isActive && (
                    <Badge className="bg-white text-[#28a745] text-xs">
                      Ativo
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tema atual: <strong>{resolvedTheme === 'dark' ? 'Escuro' : 'Claro'}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Cores de Destaque */}
      <Card>
        <CardHeader>
          <CardTitle>Cor de Destaque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                  accentColor === color.value 
                    ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-gray-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleAccentColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-sm font-medium">{accentColor}</span>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tamanho da Fonte */}
          <div className="space-y-2">
            <Label>Tamanho da Fonte</Label>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequena</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animações */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Animações</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ativar transições e animações suaves
              </p>
            </div>
            <Switch
              checked={animations}
              onCheckedChange={setAnimations}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Restaurante Exemplo</h3>
              <Badge style={{ backgroundColor: accentColor, color: 'white' }}>
                Aberto
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta é uma prévia de como ficará a interface com suas configurações.
            </p>
            <Button 
              size="sm" 
              style={{ backgroundColor: accentColor }}
              className="text-white hover:opacity-90"
            >
              Botão de Exemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          Restaurar Padrões
        </Button>
        
        {onClose && (
          <Button onClick={onClose} className="bg-[#28a745] hover:bg-[#1e7e34]">
            Aplicar Mudanças
          </Button>
        )}
      </div>
    </div>
  )
}

// Hook para usar configurações de tema
export const useThemeConfig = () => {
  const [config, setConfig] = useState({
    accentColor: '#28a745',
    fontSize: 'medium',
    animations: true
  })

  useEffect(() => {
    const savedAccentColor = localStorage.getItem('accent-color')
    const savedFontSize = localStorage.getItem('font-size')
    const savedAnimations = localStorage.getItem('animations')

    setConfig({
      accentColor: savedAccentColor || '#28a745',
      fontSize: savedFontSize || 'medium',
      animations: savedAnimations ? savedAnimations === 'true' : true
    })
  }, [])

  return config
}