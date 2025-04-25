/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita o modo escuro baseado na classe 'dark'
  theme: {
    extend: {
      // Integração com as variáveis CSS do sistema de design
      colors: {
        // Cores semânticas - utilizando as variáveis CSS
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          bg: 'var(--primary-bg)',
        },
        navbar: {
          text: '#49db0f',
        },
        
        // Cores de superfície
        surface: {
          DEFAULT: 'var(--surface-bg)',
          card: 'var(--surface-card)',
          border: 'var(--surface-border)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          tonal: 'var(--surface-tonal)',
          'tonal-hover': 'var(--surface-tonal-hover)',
        },
        
        // Cores de texto
        text: {
          DEFAULT: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        
        // Estados e feedback
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        
        // Cores base (úteis para refs diretas)
        theme: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
        },
        
        // Manter a escala de cores originais para referência e compatibilidade com código existente
        green: {
          50: 'var(--color-green-50)',
          100: 'var(--color-green-100)',
          200: 'var(--color-green-200)',
          300: 'var(--color-green-300)',
          400: 'var(--color-green-400)',
          500: 'var(--color-green-500)',
          600: 'var(--color-green-600)',
          700: 'var(--color-green-700)',
          800: 'var(--color-green-800)',
          900: 'var(--color-green-900)',
        },
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        lime: {
          50: 'var(--color-lime-50)',
          100: 'var(--color-lime-100)',
          200: 'var(--color-lime-200)',
          300: 'var(--color-lime-300)',
          400: 'var(--color-lime-400)',
          500: 'var(--color-lime-500)',
          600: 'var(--color-lime-600)',
          700: 'var(--color-lime-700)',
          800: 'var(--color-lime-800)',
          900: 'var(--color-lime-900)',
        },
        dark: {
          50: 'var(--color-dark-50)',
          100: 'var(--color-dark-100)',
          200: 'var(--color-dark-200)',
          300: 'var(--color-dark-300)',
          400: 'var(--color-dark-400)',
          500: 'var(--color-dark-500)',
          600: 'var(--color-dark-600)',
          700: 'var(--color-dark-700)',
          800: 'var(--color-dark-800)',
          900: 'var(--color-dark-900)',
        },
        'dark-green': {
          50: 'var(--color-dark-green-50)',
          100: 'var(--color-dark-green-100)',
          200: 'var(--color-dark-green-200)',
          300: 'var(--color-dark-green-300)',
          400: 'var(--color-dark-green-400)',
          500: 'var(--color-dark-green-500)',
          600: 'var(--color-dark-green-600)',
          700: 'var(--color-dark-green-700)',
          800: 'var(--color-dark-green-800)',
          900: 'var(--color-dark-green-900)',
        },
      },
      // Outros extends para espaçamentos, bordas, sombras, etc.
    },
  },
  plugins: [],
};