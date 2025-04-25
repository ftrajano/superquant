'use client';
import { createContext, useContext, useEffect, useState } from 'react';

// Criar contexto para o tema
const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
  toggleTheme: () => null,
});

// Provedor do tema
export function ThemeProvider({ children }) {
  // Estado para armazenar o tema atual
  const [theme, setTheme] = useState('light');
  
  // Carregar o tema do localStorage ao iniciar
  useEffect(() => {
    // Verificar preferência do usuário
    const storedTheme = localStorage.getItem('theme');
    
    // Se existir, usar a preferência do usuário
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Caso contrário, verificar preferência do sistema
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);
  
  // Função para alternar o tema
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Salvar no localStorage
      localStorage.setItem('theme', newTheme);
      
      // Aplicar classe ao HTML
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newTheme;
    });
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar o tema
export const useTheme = () => useContext(ThemeContext);