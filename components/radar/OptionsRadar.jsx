'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';

export default function OptionsRadar() {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('bova11');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all', // 'call', 'put', 'all'
    minStrike: '',
    maxStrike: '',
    minDays: '',
    maxDays: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'strike',
    direction: 'ascending'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Removida a funcionalidade de dados simulados
  
  // Função para buscar os dados das opções
  const fetchOptions = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/quant/radar?symbol=${symbol.toLowerCase()}`);
      
      if (!response.ok) {
        // Tentar obter mais detalhes do erro
        const errorData = await response.json().catch(() => null);
        console.error('Detalhes do erro:', errorData);
        
        throw new Error(
          errorData?.details 
            ? `Erro ao buscar dados: ${response.status} - ${errorData.details}` 
            : `Erro ao buscar dados: ${response.status}`
        );
      }
      
      const data = await response.json();
      setOptions(data.options || []);
      
      // Aplicar filtros iniciais
      applyFilters(data.options || []);
    } catch (err) {
      console.error('Erro ao buscar dados de opções:', err);
      setError(err.message || 'Erro ao buscar dados de opções');
      setOptions([]);
      setFilteredOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);
  
  // Aplicar filtros às opções
  const applyFilters = (optionsToFilter = options) => {
    let result = [...optionsToFilter];
    
    // Filtrar por tipo (call/put)
    if (filters.type !== 'all') {
      result = result.filter(option => {
        // A API retorna valores como "CALL" ou "PUT" em maiúsculas
        const optionType = option.type?.toUpperCase();
        return optionType && optionType === filters.type.toUpperCase();
      });
    }
    
    // Filtrar por strike min/max
    if (filters.minStrike && !isNaN(filters.minStrike)) {
      result = result.filter(option => option.strike >= parseFloat(filters.minStrike));
    }
    
    if (filters.maxStrike && !isNaN(filters.maxStrike)) {
      result = result.filter(option => option.strike <= parseFloat(filters.maxStrike));
    }
    
    // Filtrar por dias até vencimento min/max
    if (filters.minDays && !isNaN(filters.minDays)) {
      result = result.filter(option => {
        const days = option.days_to_maturity || 0;
        return days >= parseInt(filters.minDays);
      });
    }
    
    if (filters.maxDays && !isNaN(filters.maxDays)) {
      result = result.filter(option => {
        const days = option.days_to_maturity || 0;
        return days <= parseInt(filters.maxDays);
      });
    }
    
    // Aplicar ordenação
    result = sortOptions(result);
    
    setFilteredOptions(result);
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };
  
  // Dias até o vencimento já vem calculado na API como 'days_to_maturity'
  // Essa função está aqui apenas por compatibilidade, caso precisemos calcular manualmente
  const getDaysToMaturity = (maturityDate) => {
    if (!maturityDate) return 0;
    
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Ordenar opções usando useCallback para evitar re-renders desnecessários
  const sortOptions = useCallback((optionsToSort) => {
    return [...optionsToSort].sort((a, b) => {
      // Garantir que estamos comparando os mesmos tipos de dados
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Tratamento especial para datas
      if (sortConfig.key === 'maturity_date' || sortConfig.key === 'due_date') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } 
      // Tratamento para valores numéricos
      else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Nada a fazer, já são números
      } 
      // Tratamento para strings
      else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }
      
      // Aplicar direção da ordenação
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [sortConfig]);
  
  // Atualizar ordenação
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Formatar valor monetário
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—';
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Formatar porcentagem
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '—';
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };
  
  // Carregar dados na montagem do componente
  useEffect(() => {
    fetchOptions();
    // Cleanup function
    return () => {
      // Cleanup logic if needed
    };
  }, [fetchOptions]);
  
  // Aplicar ordenação quando a configuração mudar
  useEffect(() => {
    // Evitar atualizações desnecessárias com uma condição de guarda
    if (filteredOptions.length > 0) {
      setFilteredOptions(sortOptions(filteredOptions));
    }
  }, [sortConfig, sortOptions]);
  
  // Calcular dados de paginação
  const totalPages = Math.ceil(filteredOptions.length / pageSize);
  const paginatedOptions = filteredOptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Radar de Opções</h2>
          <p className="text-xs text-[var(--text-secondary)] italic mt-1">
            Usando dados da API OpLab
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Símbolo (ex: bova11)"
            className="px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
          />
          <button
            onClick={fetchOptions}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-white bg-[var(--primary)] rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {isLoading ? 'Carregando...' : 'Buscar'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 border border-[var(--error)] rounded-md bg-[var(--error-light)] text-[var(--error)]">
          {error}
        </div>
      )}
      
      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)]">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="mt-1 block w-full px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
            >
              <option value="all">Todos</option>
              <option value="call">CALL</option>
              <option value="put">PUT</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)]">Strike Mínimo</label>
            <input
              type="number"
              value={filters.minStrike}
              onChange={(e) => setFilters({...filters, minStrike: e.target.value})}
              placeholder="Min. Strike"
              className="mt-1 block w-full px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)]">Strike Máximo</label>
            <input
              type="number"
              value={filters.maxStrike}
              onChange={(e) => setFilters({...filters, maxStrike: e.target.value})}
              placeholder="Max. Strike"
              className="mt-1 block w-full px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)]">Dias Mínimo</label>
            <input
              type="number"
              value={filters.minDays}
              onChange={(e) => setFilters({...filters, minDays: e.target.value})}
              placeholder="Min. Dias"
              className="mt-1 block w-full px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)]">Dias Máximo</label>
            <input
              type="number"
              value={filters.maxDays}
              onChange={(e) => setFilters({...filters, maxDays: e.target.value})}
              placeholder="Max. Dias"
              className="mt-1 block w-full px-3 py-2 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-[var(--text-secondary)]">
            {filteredOptions.length} opções encontradas
          </div>
          
          <button
            onClick={() => applyFilters()}
            className="px-4 py-2 text-sm text-white bg-[var(--primary)] rounded-md hover:bg-[var(--primary-dark)]"
          >
            Aplicar Filtros
          </button>
        </div>
      </Card>
      
      {/* Tabela de resultados */}
      <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{ maxWidth: '100%', width: '100%' }}>
          <table className="min-w-full divide-y divide-[var(--surface-border)]" style={{ tableLayout: 'auto' }}>
            <thead className="bg-[var(--surface-secondary)]">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('symbol')}
                  style={{ minWidth: '110px' }}
                >
                  Símbolo {sortConfig.key === 'symbol' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('type')}
                  style={{ minWidth: '80px' }}
                >
                  Tipo {sortConfig.key === 'type' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('open')}
                >
                  Abertura {sortConfig.key === 'open' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('high')}
                >
                  Máxima {sortConfig.key === 'high' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('low')}
                >
                  Mínima {sortConfig.key === 'low' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('close')}
                >
                  Último {sortConfig.key === 'close' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('volume')}
                >
                  Volume {sortConfig.key === 'volume' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('financial_volume')}
                >
                  Vol. Fin. {sortConfig.key === 'financial_volume' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('bid')}
                >
                  Compra {sortConfig.key === 'bid' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('ask')}
                >
                  Venda {sortConfig.key === 'ask' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('due_date')}
                  style={{ minWidth: '110px' }}
                >
                  Vencimento {sortConfig.key === 'due_date' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('maturity_type')}
                  style={{ minWidth: '100px' }}
                >
                  Tipo (A/E) {sortConfig.key === 'maturity_type' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('strike')}
                >
                  Strike {sortConfig.key === 'strike' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('variation')}
                >
                  Var% {sortConfig.key === 'variation' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('spot_price')}
                >
                  Spot {sortConfig.key === 'spot_price' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('days_to_maturity')}
                  style={{ minWidth: '70px' }}
                >
                  Dias {sortConfig.key === 'days_to_maturity' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('bid_volume')}
                >
                  Vol. Compra {sortConfig.key === 'bid_volume' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('ask_volume')}
                >
                  Vol. Venda {sortConfig.key === 'ask_volume' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan="18" className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-[var(--primary)] border-t-transparent rounded-full mr-2"></div>
                      Carregando opções...
                    </div>
                  </td>
                </tr>
              ) : paginatedOptions.length === 0 ? (
                <tr>
                  <td colSpan="18" className="px-4 py-4 text-center text-[var(--text-secondary)]">
                    Nenhuma opção encontrada. Tente ajustar os filtros ou buscar outro símbolo.
                  </td>
                </tr>
              ) : (
                paginatedOptions.map((option, index) => (
                  <tr 
                    key={`${option.symbol}-${index}`}
                    className="hover:bg-[var(--surface-secondary)] cursor-pointer"
                  >
                    <td className="px-4 py-2 text-sm font-medium">{option.symbol}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        option.type?.toLowerCase() === 'call' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {option.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.open)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.high)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.low)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.close)}</td>
                    <td className="px-4 py-2 text-sm">
                      {option.volume !== undefined && option.volume !== null ? option.volume.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {option.financial_volume !== undefined && option.financial_volume !== null ? option.financial_volume.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.bid)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.ask)}</td>
                    <td className="px-4 py-2 text-sm">{formatDate(option.due_date)}</td>
                    <td className="px-4 py-2 text-sm text-center font-medium">
                      {!option.maturity_type 
                        ? '—'
                        : String(option.maturity_type).toLowerCase().includes('american') 
                          ? 'A' 
                          : String(option.maturity_type).toLowerCase().includes('european') 
                            ? 'E' 
                            : 'O'}
                    </td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(option.strike)}</td>
                    <td className="px-4 py-2 text-sm font-medium">
                      <span className={option.variation > 0 ? 'text-green-600' : option.variation < 0 ? 'text-red-600' : ''}>
                        {option.variation !== undefined && option.variation !== null ? `${option.variation.toFixed(2)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {formatCurrency(option.spot_price)}
                    </td>
                    <td className="px-4 py-2 text-sm">{option.days_to_maturity || '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      {option.bid_volume !== undefined && option.bid_volume !== null ? option.bid_volume.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {option.ask_volume !== undefined && option.ask_volume !== null ? option.ask_volume.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {filteredOptions.length > 0 && (
          <div className="px-4 py-3 bg-[var(--surface-card)] border-t border-[var(--surface-border)] flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-[var(--text-secondary)]">
                Exibindo {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredOptions.length)} de {filteredOptions.length}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-4 px-2 py-1 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)]"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)] disabled:opacity-50"
              >
                Anterior
              </button>
              <div className="px-3 py-1 text-sm">
                Página {currentPage} de {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)] disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}