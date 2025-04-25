'use client';

/**
 * Componente Badge - indicator visual para status, tags, etc.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Texto ou conteúdo do badge
 * @param {'default'|'primary'|'success'|'warning'|'error'|'info'} [props.variant='default'] - Variante visual do badge
 * @param {string} [props.className=''] - Classes adicionais para customização
 */
export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  // Estilos base para todos os badges
  const baseStyles = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  
  // Configuração de cores para cada variante
  const variantStyles = {
    default: "bg-gray-100 text-gray-800 dark:bg-dark-200 dark:text-gray-200",
    primary: "bg-primary-bg text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };
  
  return (
    <span 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}