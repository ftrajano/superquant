// components/ui/TabSelector.jsx
'use client';

import React from 'react';

/**
 * Componente TabSelector - Exibe uma barra de navegação com abas
 * 
 * @param {Object} props
 * @param {Array} props.tabs - Array de objetos { value, label } para as abas
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
          className={`px-4 py-2 capitalize whitespace-nowrap transition-colors ${
            activeTab === tab.value
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-text-secondary hover:text-primary'
          }`}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}