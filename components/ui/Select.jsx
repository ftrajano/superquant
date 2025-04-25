'use client';

import React from 'react';

/**
 * Componente Select - campo de seleção com estilo consistente
 * 
 * @param {Object} props
 * @param {string} [props.id] - ID do campo
 * @param {string} [props.name] - Nome do campo
 * @param {string} [props.label] - Label do campo
 * @param {string|number} [props.value] - Valor selecionado
 * @param {function} [props.onChange] - Callback ao alterar a seleção
 * @param {Array} props.options - Array de objetos { value, label } para as opções
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helper] - Texto de ajuda
 * @param {boolean} [props.disabled=false] - Campo desabilitado
 * @param {boolean} [props.required=false] - Campo obrigatório
 * @param {string} [props.className=''] - Classes adicionais
 * @param {string} [props.selectClassName=''] - Classes adicionais para o select
 */
export default function Select({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  error,
  helper,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  ...props
}) {
  // ID automático se não for fornecido
  const selectId = id || name || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-text-secondary font-medium text-sm mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 rounded-md
          bg-surface-bg 
          border border-surface-border
          text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:bg-surface-secondary disabled:text-text-disabled
          transition duration-200
          appearance-none
          ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
          ${selectClassName}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1 text-sm text-text-tertiary">{helper}</p>
      )}
    </div>
  );
}