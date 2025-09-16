// components/ui/TabSelector.jsx
'use client';

import React from 'react';

/**
 * Componente TabSelector - Exibe uma barra de navegação com abas
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array de objetos { value, label, letters? } para as abas
 * @param {string} props.activeTab - Valor da aba ativa
 * @param {function} props.onTabChange - Função chamada ao mudar de aba
 * @param {string} [props.className] - Classes adicionais para o container
 */
export default function TabSelector({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`flex border-b border-surface-border mb-4 overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`px-4 py-2 capitalize whitespace-nowrap transition-colors relative ${
            activeTab === tab.value
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-text-secondary hover:text-primary'
          }`}
          onClick={() => onTabChange(tab.value)}
          title={tab.letters ? `Códigos de vencimento: ${tab.letters}` : ''}
        >
          {tab.label}
          {tab.letters && (
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-base rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Códigos: {tab.letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}