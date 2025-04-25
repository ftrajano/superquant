'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Componente Button - botão consistente para toda a aplicação
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {'primary'|'secondary'|'outline'|'danger'} [props.variant='primary'] - Variante visual do botão
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamanho do botão
 * @param {string} [props.className=''] - Classes adicionais para customização
 * @param {string} [props.href] - Se fornecido, renderiza como um Link do Next.js
 * @param {boolean} [props.fullWidth=false] - Se o botão deve ocupar toda a largura disponível
 * @param {boolean} [props.disabled=false] - Se o botão está desabilitado
 * @param {boolean} [props.isLoading=false] - Se o botão está em estado de carregamento
 * @param {function} [props.onClick] - Função de callback ao clicar no botão
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  fullWidth = false,
  disabled = false,
  isLoading = false,
  type = 'button',
  onClick,
  ...props
}) {
  // Estilos base comuns para todas as variantes
  const baseStyles = "flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50";
  
  // Estilos específicos para cada variante
  const variantStyles = {
    primary: "bg-primary hover:bg-primary-hover text-white disabled:bg-gray-300 disabled:text-gray-500",
    secondary: "bg-surface-secondary hover:bg-surface-tertiary text-text border border-surface-border disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200",
    outline: "bg-transparent hover:bg-primary-bg text-primary border border-primary disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent",
    danger: "bg-error hover:opacity-90 text-white disabled:bg-red-200 disabled:text-red-100"
  };
  
  // Estilos específicos para cada tamanho
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base"
  };
  
  // Estilo para width
  const widthStyle = fullWidth ? "w-full" : "";
  
  // Classes combinadas
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;
  
  // Conteúdo do botão com loading state
  const buttonContent = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </>
  );
  
  // Se houver uma URL, renderizar como um Link
  if (href) {
    return (
      <Link
        href={href}
        className={`${buttonClasses} ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // Caso contrário, renderizar como um botão normal
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {buttonContent}
    </button>
  );
}