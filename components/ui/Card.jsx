'use client';

/**
 * Componente Card - container com estilo consistente para toda a aplicação
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo do card
 * @param {string} [props.title] - Título opcional do card
 * @param {React.ReactNode} [props.action] - Botão ou ação para exibir no cabeçalho
 * @param {string} [props.className=''] - Classes adicionais para customização
 * @param {string} [props.headerClassName=''] - Classes adicionais para o cabeçalho
 * @param {string} [props.bodyClassName=''] - Classes adicionais para o corpo
 * @param {boolean} [props.noPadding=false] - Remover padding do corpo do card
 */
export default function Card({
  children,
  title,
  action,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  noPadding = false,
  ...props
}) {
  const hasHeader = title || action;
  
  return (
    <div 
      className={`bg-surface-card border border-surface-border rounded-lg shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className={`flex justify-between items-center px-4 py-3 border-b border-surface-border bg-surface-secondary ${headerClassName}`}>
          {title && <h3 className="font-medium text-text-primary">{title}</h3>}
          {action && <div className="flex">{action}</div>}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-4'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}