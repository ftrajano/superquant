// components/ui/StatusBadge.jsx
import React from 'react';

export default function StatusBadge({ status }) {
  let colorClass = '';
  
  switch (status) {
    case 'Aberta':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Fechada':
      colorClass = 'bg-gray-100 text-gray-800';
      break;
    case 'Parcialmente Fechada':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Compra':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Venda':
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
      {status}
    </span>
  );
}