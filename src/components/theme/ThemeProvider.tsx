"use client"

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Verificar preferência salva ou preferência do sistema
    const savedTheme = localStorage.getItem('kimaaki-theme') as Theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('kimaaki-theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    handleSetTheme(newTheme)
  }

  // Evitar hidratação mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Componente de Toggle do Tema
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function ThemeToggle({ size = 'md', variant = 'ghost' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Button
      variant={variant}
      size="sm"
      className={`${sizeClasses[size]} p-0 transition-all duration-300 hover:scale-110`}
      onClick={toggleTheme}
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className={`${iconSizes[size]} text-[#6c757d] hover:text-[#28a745]`} />
      ) : (
        <Sun className={`${iconSizes[size]} text-yellow-500 hover:text-yellow-400`} />
      )}
    </Button>
  )
}

// CSS personalizado para o tema escuro (adicionar ao globals.css)
export const darkModeStyles = `
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 142 76% 36%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 142 76% 36%;
  --radius: 0.5rem;
}

.dark body {
  background-color: hsl(222.2 84% 4.9%);
  color: hsl(210 40% 98%);
}

.dark .bg-white {
  background-color: hsl(222.2 84% 4.9%) !important;
}

.dark .text-\\[\\#000000\\] {
  color: hsl(210 40% 98%) !important;
}

.dark .text-\\[\\#6c757d\\] {
  color: hsl(215 20.2% 65.1%) !important;
}

.dark .border-gray-200 {
  border-color: hsl(217.2 32.6% 17.5%) !important;
}

.dark .bg-gray-50 {
  background-color: hsl(217.2 32.6% 17.5%) !important;
}

.dark .bg-gray-100 {
  background-color: hsl(217.2 32.6% 17.5%) !important;
}

.dark .hover\\:bg-gray-100:hover {
  background-color: hsl(217.2 32.6% 25%) !important;
}

.dark .shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.dark .shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Gradientes no modo escuro */
.dark .bg-gradient-to-b.from-\\[\\#28a745\\].to-\\[\\#1e7e34\\] {
  background: linear-gradient(180deg, #1e7e34 0%, #155724 100%);
}

/* Cards no modo escuro */
.dark .bg-white.rounded-2xl,
.dark .bg-white.rounded-xl {
  background-color: hsl(217.2 32.6% 17.5%) !important;
  border: 1px solid hsl(217.2 32.6% 25%);
}

/* Inputs no modo escuro */
.dark input,
.dark textarea,
.dark select {
  background-color: hsl(217.2 32.6% 17.5%) !important;
  border-color: hsl(217.2 32.6% 25%) !important;
  color: hsl(210 40% 98%) !important;
}

.dark input::placeholder,
.dark textarea::placeholder {
  color: hsl(215 20.2% 65.1%) !important;
}

/* Botões no modo escuro */
.dark .bg-\\[\\#28a745\\] {
  background-color: #1e7e34 !important;
}

.dark .hover\\:bg-\\[\\#1e7e34\\]:hover {
  background-color: #155724 !important;
}

.dark .border-\\[\\#28a745\\] {
  border-color: #1e7e34 !important;
}

.dark .text-\\[\\#28a745\\] {
  color: #34ce57 !important;
}

/* Navbar no modo escuro */
.dark .fixed.bottom-0 {
  background-color: hsl(217.2 32.6% 17.5%) !important;
  border-top-color: hsl(217.2 32.6% 25%) !important;
}
`

// Hook para detectar preferência do sistema
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}

// Componente de configuração de tema
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const systemTheme = useSystemTheme()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {theme === 'light' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-500" />
          )}
          <span>Aparência</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tema do aplicativo</Label>
          <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4" />
                  <span>Claro</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4" />
                  <span>Escuro</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-[#6c757d]">
          <p>Tema do sistema: {systemTheme === 'dark' ? 'Escuro' : 'Claro'}</p>
          <p className="mt-1">
            O tema escuro reduz o cansaço visual em ambientes com pouca luz e pode economizar bateria em dispositivos com tela OLED.
          </p>
        </div>

        {/* Preview dos temas */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs">Tema Claro</Label>
            <div className="w-full h-20 bg-white border-2 border-gray-200 rounded-lg p-2 space-y-1">
              <div className="w-full h-2 bg-[#28a745] rounded"></div>
              <div className="w-3/4 h-1 bg-gray-300 rounded"></div>
              <div className="w-1/2 h-1 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Tema Escuro</Label>
            <div className="w-full h-20 bg-gray-900 border-2 border-gray-700 rounded-lg p-2 space-y-1">
              <div className="w-full h-2 bg-[#1e7e34] rounded"></div>
              <div className="w-3/4 h-1 bg-gray-600 rounded"></div>
              <div className="w-1/2 h-1 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}