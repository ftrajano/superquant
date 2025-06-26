'use client';

import { useState, useEffect, useRef } from 'react';

export default function UserAutocomplete({ onUserSelect, placeholder = "Digite o nome do usuário..." }) {
  const [query, setQuery] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Buscar usuários com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        buscarUsuarios(query);
      } else {
        setUsuarios([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buscarUsuarios = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
        setShowDropdown(data.usuarios?.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (usuarios.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleUserSelect = (usuario) => {
    setQuery(`${usuario.name} (${usuario.email})`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onUserSelect(usuario);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || usuarios.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < usuarios.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < usuarios.length) {
          handleUserSelect(usuarios[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSelection = () => {
    setQuery('');
    setUsuarios([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full px-3 py-2 pr-10 border border-surface-border rounded-md shadow-sm bg-surface-card text-text-primary focus:outline-none focus:ring-primary focus:border-primary"
          autoComplete="off"
        />
        
        {/* Botão limpar */}
        {query && (
          <button
            onClick={clearSelection}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            ×
          </button>
        )}

        {/* Indicador de loading */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Dropdown com resultados */}
      {showDropdown && usuarios.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {usuarios.map((usuario, index) => (
            <div
              key={usuario._id}
              onClick={() => handleUserSelect(usuario)}
              className={`px-3 py-2 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="font-medium">{usuario.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{usuario.email}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {query.length >= 2 && !isLoading && usuarios.length === 0 && !showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-600 dark:text-gray-300 text-center">
            Nenhum usuário encontrado
          </div>
        </div>
      )}

      {/* Dica de uso - apenas quando não há query ou query é muito curta */}
      {query.length === 1 && !showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-600 dark:text-gray-300 text-sm text-center">
            Digite pelo menos 2 caracteres para buscar
          </div>
        </div>
      )}
    </div>
  );
}