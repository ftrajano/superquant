// components/ui/TabSelector.jsx
'use client';

import React from 'react';

export default function TabSelector({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-gray-300 mb-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`px-4 py-2 capitalize whitespace-nowrap ${
            activeTab === tab.value
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}