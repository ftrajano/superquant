// components/ui/StatusBadge.jsx
'use client';

import Badge from './Badge';

/**
 * Componente StatusBadge - Badge especializado para exibir status de operações
 * 
 * @param {Object} props
 * @param {string} props.status - Status da operação ou item
 * @param {string} [props.className=''] - Classes adicionais
 */
export default function StatusBadge({ status, className = '' }) {
  // Mapear o status para a variante do Badge
  let variant = 'default';
  
  switch (status) {
    case 'Aberta':
      variant = 'success';
      break;
    case 'Fechada':
      variant = 'default';
      break;
    case 'Parcialmente Fechada':
      variant = 'warning';
      break;
    case 'Compra':
      variant = 'info';
      break;
    case 'Venda':
      variant = 'error';
      break;
    default:
      variant = 'default';
  }
  
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}