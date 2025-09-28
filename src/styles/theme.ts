// KIMAAKI - Tema Visual Centralizado
// Cores principais do aplicativo de delivery

export const theme = {
  colors: {
    // Cores principais
    primary: '#28a745',           // Verde principal
    primaryDark: '#1e7e34',       // Verde mais escuro para gradientes
    primaryLight: '#34ce57',      // Verde mais claro para hover
    
    // Cores secundárias
    secondary: '#000000',         // Preto para detalhes
    secondaryLight: '#333333',    // Cinza escuro
    
    // Backgrounds
    background: '#ffffff',        // Fundo branco
    backgroundGray: '#f8f9fa',    // Fundo cinza claro
    
    // Textos
    textPrimary: '#000000',       // Texto principal (preto)
    textSecondary: '#6c757d',     // Texto secundário (cinza)
    textOnPrimary: '#ffffff',     // Texto em fundo verde (branco)
    textMuted: '#868e96',         // Texto desbotado
    
    // Estados
    success: '#28a745',           // Verde para sucesso
    warning: '#ffc107',           // Amarelo para avisos
    error: '#dc3545',             // Vermelho para erros
    info: '#17a2b8',              // Azul para informações
    
    // Bordas e divisores
    border: '#dee2e6',            // Bordas padrão
    borderLight: '#e9ecef',       // Bordas claras
    
    // Sombras
    shadow: 'rgba(0, 0, 0, 0.1)', // Sombra padrão
    shadowDark: 'rgba(0, 0, 0, 0.15)', // Sombra mais escura
  },
  
  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
    primaryHover: 'linear-gradient(135deg, #34ce57 0%, #28a745 100%)',
    header: 'linear-gradient(180deg, #28a745 0%, #1e7e34 100%)',
  },
  
  // Espaçamentos
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
  },
  
  // Bordas arredondadas
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',   // Totalmente arredondado
  },
  
  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Transições
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  // Breakpoints responsivos
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
} as const

// Utilitários para usar as cores
export const getThemeColor = (colorPath: string) => {
  const keys = colorPath.split('.')
  let value: any = theme
  
  for (const key of keys) {
    value = value[key]
    if (value === undefined) return '#000000'
  }
  
  return value
}

// Classes CSS customizadas para usar no Tailwind
export const customClasses = {
  // Botões
  btnPrimary: 'bg-[#28a745] hover:bg-[#1e7e34] text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95',
  btnSecondary: 'bg-white hover:bg-gray-50 text-[#28a745] border-2 border-[#28a745] font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95',
  btnGhost: 'bg-transparent hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition-all duration-300',
  
  // Cards
  cardFeatured: 'bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden',
  cardRegular: 'bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden',
  
  // Headers
  headerGradient: 'bg-gradient-to-b from-[#28a745] to-[#1e7e34] text-white',
  
  // Navegação
  navItemActive: 'text-[#28a745] font-medium',
  navItemInactive: 'text-black font-normal',
  
  // Inputs
  inputPrimary: 'border-2 border-gray-200 focus:border-[#28a745] focus:ring-2 focus:ring-[#28a745]/20 rounded-lg px-3 py-2 transition-all duration-300',
  
  // Badges
  badgeSuccess: 'bg-[#28a745] text-white px-2 py-1 rounded-full text-xs font-medium',
  badgeSecondary: 'bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium',
}

export default theme