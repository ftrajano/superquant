'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import { Card } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import StatusBadge from '@/components/ui/StatusBadge.jsx';

export default function QuantPage() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionDataLoading, setOptionDataLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionDetails, setOptionDetails] = useState(null);
  const [bsData, setBsData] = useState(null);
  const [error, setError] = useState(null);
  const [errorOperacoes, setErrorOperacoes] = useState(null);
  const [optionsData, setOptionsData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [portfolioDelta, setPortfolioDelta] = useState(0);
  const [selectionDelta, setSelectionDelta] = useState(0);

  // Buscar operações abertas
  const fetchOperacoes = async () => {
    setLoading(true);
    setErrorOperacoes(null);
    
    try {
      const response = await fetch('/api/operacoes?status=Aberta');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar operações: ${response.status}`);
      }
      
      const data = await response.json();
      setOperacoes(data.operacoes || []);
      
      // Iniciar carregamento de dados de todas as opções
      if (data.operacoes && data.operacoes.length > 0) {
        loadAllOptionsData(data.operacoes);
      }
    } catch (err) {
      console.error('Erro ao buscar operações:', err);
      setErrorOperacoes(err.message || 'Erro ao buscar operações');
    } finally {
      setLoading(false);
    }
  };

  // Buscar detalhes de uma opção específica para display detalhado
  const fetchOptionData = async (symbol) => {
    setOptionDataLoading(true);
    setError(null);
    
    try {
      // Buscar detalhes básicos da opção
      const detailsResponse = await fetch(`/api/quant/option-details?symbol=${symbol}`);
      
      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        throw new Error(`Erro ao buscar detalhes: ${errorText}`);
      }
      
      const detailsData = await detailsResponse.json();
      setOptionDetails(detailsData);
      
      // Buscar dados do modelo Black-Scholes
      const bsResponse = await fetch(`/api/quant/black-scholes?symbol=${symbol}`);
      
      if (bsResponse.ok) {
        const bsData = await bsResponse.json();
        setBsData(bsData);
      } else {
        setBsData(null);
        console.warn(`Não foi possível obter dados do modelo BS para ${symbol}`);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da opção:', err);
      setError(err.message || 'Erro ao buscar dados da opção');
      setOptionDetails(null);
      setBsData(null);
    } finally {
      setOptionDataLoading(false);
    }
  };

  // Carregar dados para todas as opções da carteira
  const loadAllOptionsData = async (ops) => {
    const newOptionsData = { ...optionsData };
    let totalDelta = 0;
    
    for (const op of ops) {
      const symbol = formatSymbol(op.ticker);
      
      try {
        // Buscar dados da API Black-Scholes para cálculo do delta
        const bsResponse = await fetch(`/api/quant/black-scholes?symbol=${symbol}`);
        
        if (bsResponse.ok) {
          const data = await bsResponse.json();
          
          // Calcular o delta ajustado pela direção e tipo da opção
          // Call comprada: delta positivo | Call vendida: delta negativo
          // Put comprada: delta negativo (já que o delta da put é negativo) | Put vendida: delta positivo
          let adjustedDelta;
          if (op.tipo === 'CALL') {
            // Para CALL: compra -> positivo, venda -> negativo
            const deltaDirection = op.direcao === 'COMPRA' ? 1 : -1;
            adjustedDelta = data.delta * deltaDirection * (op.quantidade || 1);
          } else {
            // Para PUT: compra -> mantém sinal (já é negativo), venda -> inverte sinal
            const deltaDirection = op.direcao === 'VENDA' ? -1 : 1;
            adjustedDelta = data.delta * deltaDirection * (op.quantidade || 1);
          }
          
          // Armazenar os dados da opção
          newOptionsData[op._id] = {
            ...data,
            ticker: op.ticker,
            adjustedDelta,
            // Armazenar os valores originais também para exibir na tabela
            originalDelta: data.delta,
            originalGamma: data.gamma,
            originalTheta: data.theta,
            originalVega: data.vega,
            loadError: null
          };
          
          // Adicionar ao delta total da carteira
          totalDelta += adjustedDelta;
        } else {
          // Se houver erro, ainda criar um registro para a opção
          newOptionsData[op._id] = {
            ticker: op.ticker,
            loadError: `Erro ao carregar dados para ${op.ticker}`,
            delta: null,
            adjustedDelta: 0,
            gamma: null,
            theta: null,
            vega: null
          };
        }
      } catch (error) {
        console.error(`Erro ao carregar dados para ${op.ticker}:`, error);
        newOptionsData[op._id] = {
          ticker: op.ticker,
          loadError: error.message || 'Erro desconhecido',
          delta: null,
          adjustedDelta: 0,
          gamma: null,
          theta: null,
          vega: null
        };
      }
    }
    
    setOptionsData(newOptionsData);
    setPortfolioDelta(Number(totalDelta.toFixed(3)));
  };

  // Formatar o símbolo da opção para o formato da API
  const formatSymbol = (ticker) => {
    // Converter para minúsculo e remover espaços
    return ticker.toLowerCase().trim();
  };

  // Lidar com clique em uma opção
  const handleOptionClick = (operacao) => {
    const symbol = formatSymbol(operacao.ticker);
    setSelectedOption(operacao);
    fetchOptionData(symbol);
  };

  // Gerenciar seleção múltipla de opções para análise
  const handleToggleSelection = (operacaoId) => {
    let newSelection;
    
    if (selectedOptions.includes(operacaoId)) {
      newSelection = selectedOptions.filter(id => id !== operacaoId);
    } else {
      newSelection = [...selectedOptions, operacaoId];
    }
    
    setSelectedOptions(newSelection);
    
    // Recalcular delta da seleção
    const newSelectionDelta = newSelection.reduce((sum, id) => {
      const opData = optionsData[id];
      return sum + (opData?.adjustedDelta || 0);
    }, 0);
    
    setSelectionDelta(Number(newSelectionDelta.toFixed(3)));
  };

  // Formatar valor monetário
  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '—';
    
    // Formato brasileiro com EXATAMENTE duas casas decimais
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOperacoes();
    }
  }, [status]);

  // Renderizar linha da tabela para uma operação
  const renderOperacaoRow = (operacao) => {
    const isSelected = selectedOption && selectedOption._id === operacao._id;
    const opData = optionsData[operacao._id] || {};
    const isChecked = selectedOptions.includes(operacao._id);
    
    return (
      <tr 
        key={operacao._id} 
        className={`border-b border-[var(--surface-border)] hover:bg-[var(--surface-secondary)] dark:hover:bg-[var(--surface-tertiary)] ${isSelected ? 'bg-[var(--surface-tonal)]' : ''}`}
        onClick={() => handleOptionClick(operacao)}
      >
        <td className="px-2 py-3 text-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              e.stopPropagation(); // Impedir que o clique propague para a linha
              handleToggleSelection(operacao._id);
            }}
            className="h-4 w-4 text-[var(--primary)] border-[var(--surface-border)] rounded focus:ring-[var(--primary)]"
          />
        </td>
        <td className="px-4 py-3">
          <span className="font-medium text-[var(--primary)]">{operacao.ticker}</span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
            operacao.tipo === 'CALL' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {operacao.tipo === 'CALL' ? 'C' : 'P'}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
            operacao.direcao === 'COMPRA' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {operacao.direcao}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          {formatarMoeda(operacao.strike)}
        </td>
        <td className="px-4 py-3 text-sm">
          {operacao.mesReferencia}/{operacao.anoReferencia}
        </td>
        <td className="px-4 py-3 text-sm">
          {formatarMoeda(operacao.preco)}
        </td>
        <td className="px-3 py-3 text-sm text-center">
          {operacao.quantidade || 1}
        </td>
        <td className="px-4 py-3 text-sm">
          {formatarMoeda((operacao.preco * operacao.quantidade * 100) || 0)}
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          <span className={`${opData.loadError ? 'text-red-500' : ''} ${
            (opData.adjustedDelta || 0) > 0 
              ? 'text-green-600' 
              : (opData.adjustedDelta || 0) < 0 
                ? 'text-red-600' 
                : ''
          }`}>
            {opData.loadError 
              ? 'Erro' 
              : ((opData.adjustedDelta || 0) > 0 
                  ? '+' + (opData.originalDelta?.toFixed(3) || '—')
                  : (opData.adjustedDelta || 0) < 0
                    ? '-' + Math.abs(opData.originalDelta || 0).toFixed(3)
                    : opData.originalDelta?.toFixed(3) || '—')
            }
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          <span className={opData.loadError ? 'text-red-500' : ''}>
            {opData.loadError ? 'Erro' : (opData.originalGamma?.toFixed(3) || '—')}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          <span className={opData.loadError ? 'text-red-500' : ''}>
            {opData.loadError ? 'Erro' : (opData.originalTheta?.toFixed(3) || '—')}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          <span className={opData.loadError ? 'text-red-500' : ''}>
            {opData.loadError ? 'Erro' : (opData.originalVega?.toFixed(3) || '—')}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--primary)]">Análise Quantitativa</h1>
              <p className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">Análise de gregas e métricas de opções</p>
            </div>
          </div>
          
          {errorOperacoes && (
            <div className="mb-6 p-4 border border-[var(--error)] rounded-md bg-[var(--error-light)] text-[var(--error)]">
              {errorOperacoes}
            </div>
          )}
          
          {/* Filtros e Ações com contadores de Delta */}
          <div className="mb-4 flex flex-wrap justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Delta da carteira */}
              <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
                <div className="mr-2 text-xs text-[var(--text-secondary)]">Delta da carteira:</div>
                <div 
                  className="font-semibold text-sm"
                  style={{
                    color: portfolioDelta > 0 
                      ? theme === 'dark' ? '#00cc00' : '#16a34a' 
                      : portfolioDelta < 0 
                        ? '#dc2626' 
                        : '#6b7280'
                  }}
                >
                  {portfolioDelta > 0 ? '+' : ''}{portfolioDelta}
                </div>
              </div>
              
              {/* Delta da seleção */}
              <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
                <div className="mr-2 text-xs text-[var(--text-secondary)]">Delta seleção:</div>
                <div 
                  className="font-semibold text-sm"
                  style={{
                    color: selectionDelta > 0 
                      ? theme === 'dark' ? '#00cc00' : '#16a34a' 
                      : selectionDelta < 0 
                        ? '#dc2626' 
                        : '#6b7280'
                  }}
                >
                  {selectionDelta > 0 ? '+' : ''}{selectionDelta}
                </div>
              </div>
              
              <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
                <div className="text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">{operacoes.length}</span> opções • 
                  <span className="font-medium ml-1">{selectedOptions.length}</span> selecionadas
                </div>
              </div>
            </div>
            
            {/* Informações sobre delta */}
            <div className="flex items-center text-xs text-[var(--text-secondary)] italic">
              Delta = exposição direcional
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Suas Opções Abertas</h2>
          
          {/* Estado de carregamento */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">Carregando operações...</p>
            </div>
          )}
          
          {/* Lista de operações */}
          {!loading && !error && (
            <>
              {operacoes.length === 0 ? (
                <div className="text-center py-8 bg-[var(--surface-secondary)] rounded-lg">
                  <p className="text-[var(--text-secondary)]">
                    Você não possui operações abertas no momento.
                  </p>
                </div>
              ) : (
                <div className="bg-[var(--surface-card)] rounded-lg shadow">
                  <table className="w-full table-fixed divide-y divide-[var(--surface-border)]">
                    <thead className="bg-[var(--surface-secondary)]">
                      <tr>
                        <th className="w-8 px-2 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Sel</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Ticker</th>
                        <th className="w-12 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Tipo</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Direção</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Strike</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Vencimento</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Preço</th>
                        <th className="w-12 px-3 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Qtde</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Valor Total</th>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Delta</th>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Gamma</th>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Theta</th>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Vega</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                      {operacoes.map(renderOperacaoRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          
          {/* Detalhes da opção selecionada */}
          {selectedOption && (
            <Card className="mb-6 mt-8">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    Detalhes da Opção: {selectedOption.ticker}
                    {optionDataLoading && (
                      <span className="ml-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[var(--primary)] border-r-transparent"></span>
                    )}
                  </h2>
                  <button 
                    onClick={() => setSelectedOption(null)}
                    className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                    aria-label="Fechar detalhes"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {error && (
                  <div className="mb-6 p-4 border border-[var(--error)] rounded-md bg-[var(--error-light)] text-[var(--error)]">
                    Não foi possível carregar os detalhes para {selectedOption.ticker}: {error}
                  </div>
                )}
                
                {optionDetails && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Informações Básicas</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Ativo Base:</span>
                            <span className="font-medium">{optionDetails.underlier}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Tipo:</span>
                            <span className="font-medium">{optionDetails.type === 'CALL' ? 'CALL' : 'PUT'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Strike:</span>
                            <span className="font-medium">R$ {optionDetails.strike?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Vencimento:</span>
                            <span className="font-medium">{optionDetails.maturityDate ? new Date(optionDetails.maturityDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Dias até vencimento:</span>
                            <span className="font-medium">{optionDetails.daysToMaturity || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Dados de Mercado</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Último Preço:</span>
                            <span className="font-medium">R$ {optionDetails.last?.toFixed(2) || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Variação:</span>
                            <span className={`font-medium ${(optionDetails.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {optionDetails.change?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Volume:</span>
                            <span className="font-medium">{optionDetails.volume?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Volatilidade Implícita:</span>
                            <span className="font-medium">{optionDetails.impliedVolatility?.toFixed(2) || 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                            <span className="text-[var(--text-secondary)]">Delta:</span>
                            <span className="font-medium">{optionDetails.delta?.toFixed(3) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dados do modelo Black-Scholes */}
                    {bsData && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Modelo Black-Scholes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-2">
                              <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                                <span className="text-[var(--text-secondary)]">Preço Teórico:</span>
                                <span className="font-medium">R$ {bsData.price?.toFixed(2) || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                                <span className="text-[var(--text-secondary)]">Preço do Ativo:</span>
                                <span className="font-medium">R$ {bsData.stockPrice?.toFixed(2) || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                                <span className="text-[var(--text-secondary)]">Taxa de Juros:</span>
                                <span className="font-medium">{bsData.interestRate?.toFixed(2) || 'N/A'}%</span>
                              </div>
                              <div className="flex justify-between border-b border-[var(--surface-border)] pb-1">
                                <span className="text-[var(--text-secondary)]">Volatilidade:</span>
                                <span className="font-medium">{(bsData.volatility * 100)?.toFixed(2) || 'N/A'}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Greeks</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-[var(--surface-tonal)] rounded-md">
                                <div className="text-sm text-[var(--text-secondary)]">Delta</div>
                                <div className="text-lg font-bold">{bsData.delta?.toFixed(3) || 'N/A'}</div>
                              </div>
                              <div className="p-3 bg-[var(--surface-tonal)] rounded-md">
                                <div className="text-sm text-[var(--text-secondary)]">Gamma</div>
                                <div className="text-lg font-bold">{bsData.gamma?.toFixed(3) || 'N/A'}</div>
                              </div>
                              <div className="p-3 bg-[var(--surface-tonal)] rounded-md">
                                <div className="text-sm text-[var(--text-secondary)]">Theta</div>
                                <div className="text-lg font-bold">{bsData.theta?.toFixed(3) || 'N/A'}</div>
                              </div>
                              <div className="p-3 bg-[var(--surface-tonal)] rounded-md">
                                <div className="text-sm text-[var(--text-secondary)]">Vega</div>
                                <div className="text-lg font-bold">{bsData.vega?.toFixed(3) || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}
          
          {/* Busca manual de opções */}
          {!selectedOption && !loading && (
            <Card className="mb-6">
              <div className="p-4">
                <p className="text-center text-[var(--text-secondary)]">
                  Selecione uma opção da tabela acima para visualizar informações detalhadas.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}