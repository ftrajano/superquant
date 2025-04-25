'use client';

import React from 'react';

/**
 * Componente Input - campo de entrada com estilo consistente
 * 
 * @param {Object} props
 * @param {string} [props.id] - ID do campo
 * @param {string} [props.name] - Nome do campo
 * @param {string} [props.type='text'] - Tipo do input (text, email, password, etc)
 * @param {string} [props.label] - Label do campo
 * @param {string} [props.placeholder] - Placeholder do campo
 * @param {string} [props.value] - Valor do campo
 * @param {function} [props.onChange] - Callback ao alterar o valor
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helper] - Texto de ajuda
 * @param {boolean} [props.disabled=false] - Campo desabilitado
 * @param {boolean} [props.required=false] - Campo obrigatório
 * @param {string} [props.className=''] - Classes adicionais
 * @param {string} [props.inputClassName=''] - Classes adicionais para o input
 */
export default function Input({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  helper,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  // ID automático se não for fornecido
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-text-secondary font-medium text-sm mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 rounded-md
          bg-surface-bg 
          border border-surface-border
          text-text-primary placeholder:text-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:bg-surface-secondary disabled:text-text-disabled
          transition duration-200
          ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
          ${inputClassName}
        `}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1 text-sm text-text-tertiary">{helper}</p>
      )}
    </div>
  );
}