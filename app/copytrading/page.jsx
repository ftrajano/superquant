'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import TabSelector from '@/components/ui/TabSelector.jsx';
import YearSelector from '@/components/ui/YearSelector.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CopyTradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesAtivo = searchParams.get('mes') || 'abril';
  const anoAtivo = searchParams.get('ano') || new Date().getFullYear().toString();
  const { data: session, status } = useSession();
  
  const [operacoes, setOperacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [operacaoParaFechar, setOperacaoParaFechar] = useState(null);
  const [precoFechamento, setPrecoFechamento] = useState('');
  const [isSubmittingFechar, setIsSubmittingFechar] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  
  // Estados para seleção de cesta de operações
  const [cestalSelecionada, setCestaSeleccionada] = useState([]);
  const [mostraResumo, setMostraResumo] = useState(false);
  
  // Lista de meses para as abas
  const meses = [
    { value: 'janeiro', label: 'Janeiro' },
    { value: 'fevereiro', label: 'Fevereiro' },
    { value: 'marco', label: 'Março' },
    { value: 'abril', label: 'Abril' },
    { value: 'maio', label: 'Maio' },
    { value: 'junho', label: 'Junho' },
    { value: 'julho', label: 'Julho' },
    { value: 'agosto', label: 'Agosto' },
    { value: 'setembro', label: 'Setembro' },
    { value: 'outubro', label: 'Outubro' },
    { value: 'novembro', label: 'Novembro' },
    { value: 'dezembro', label: 'Dezembro' }
  ];
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Carregar operações ao mudar o mês ou o filtro de status
  useEffect(() => {
    const fetchOperacoes = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let queryParams = `mes=${mesAtivo}&ano=${anoAtivo}&origem=copytrading`; // 'origem=copytrading' indica ao backend para buscar operações de usuários modelo
        if (statusFiltro !== 'Todos') {
          queryParams += `&status=${statusFiltro}`;
        }
        
        const response = await fetch(`/api/operacoes?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar operações de copytrading');
        }
        
        const data = await response.json();
        setOperacoes(data.operacoes || []);
      } catch (err) {
        console.error('Erro:', err);
        setError('Não foi possível carregar as operações. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOperacoes();
  }, [mesAtivo, statusFiltro, status]);
  
  // Alternar entre meses
  const handleTabChange = (mes) => {
    router.push(`/copytrading?mes=${mes}&ano=${anoAtivo}`);
  };
  
  // Alternar entre anos
  const handleYearChange = (ano) => {
    router.push(`/copytrading?mes=${mesAtivo}&ano=${ano}`);
  };
  
  // Funções para gerenciar a cesta de operações
  const handleToggleSelecao = (operacaoId) => {
    if (cestalSelecionada.includes(operacaoId)) {
      setCestaSeleccionada(cestalSelecionada.filter(id => id !== operacaoId));
    } else {
      setCestaSeleccionada([...cestalSelecionada, operacaoId]);
    }
  };
  
  const calcularSaldoCesta = () => {
    const operacoesDaCesta = operacoes.filter(op => cestalSelecionada.includes(op._id));
    return operacoesDaCesta.reduce((total, op) => total + (op.resultadoTotal || 0), 0);
  };
  
  const limparCesta = () => {
    setCestaSeleccionada([]);
    setMostraResumo(false);
  };
  
  // Formatar data
  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-800">CopyTrading</h1>
          <p className="text-gray-600">Operações dos usuários modelo para você se inspirar</p>
          <div className="mt-2 text-sm text-gray-500">
            Todas as operações realizadas pelos usuários com papel "modelo" aparecem automaticamente aqui.
          </div>
        </div>
      </div>
      
      {/* Seletor de Ano */}
      <YearSelector
        currentYear={anoAtivo}
        onYearChange={handleYearChange}
      />
      
      {/* Selector de Meses */}
      <TabSelector 
        tabs={meses} 
        activeTab={mesAtivo} 
        onTabChange={handleTabChange} 
      />
      
      {/* Filtros e Ações */}
      <div className="mb-4 flex flex-wrap justify-between gap-4">
        <div className="inline-flex shadow-sm rounded-md">
          <button
            type="button"
            onClick={() => setStatusFiltro('Todos')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              statusFiltro === 'Todos' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFiltro('Aberta')}
            className={`px-4 py-2 text-sm font-medium ${
              statusFiltro === 'Aberta' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Abertas
          </button>
          <button
            type="button"
            onClick={() => setStatusFiltro('Fechada')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              statusFiltro === 'Fechada' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Fechadas
          </button>
        </div>
        
        {/* Ações da Cesta */}
        <div className="flex gap-2">
          {cestalSelecionada.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setMostraResumo(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Ver Resumo ({cestalSelecionada.length})
              </button>
              <button
                type="button"
                onClick={limparCesta}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Limpar Seleção
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Resumo da Cesta */}
      {mostraResumo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Resumo da Cesta</h2>
            <div className="mb-4">
              <p className="text-lg font-bold mb-2">
                Operações selecionadas: {cestalSelecionada.length}
              </p>
              <p className="text-xl font-bold">
                Saldo total: 
                <span className={
                  calcularSaldoCesta() > 0 
                    ? ' text-green-600' 
                    : calcularSaldoCesta() < 0 
                      ? ' text-red-600' 
                      : ''
                }>
                  {' '}{formatarMoeda(calcularSaldoCesta())}
                </span>
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ticker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Resultado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operacoes
                    .filter(op => cestalSelecionada.includes(op._id))
                    .map(op => (
                      <tr key={`cesta-${op._id}`}>
                        <td className="px-3 py-2 text-sm">
                          {op.ticker || (op.nome ? op.nome : 'N/A')}
                          {op.idVisual && (
                            <div className="text-xs text-gray-500">{op.idVisual}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{op.tipo} {op.direcao === 'COMPRA' ? '↑' : '↓'}</td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <span className={
                            op.resultadoTotal > 0 
                              ? 'text-green-600' 
                              : op.resultadoTotal < 0 
                                ? 'text-red-600' 
                                : 'text-gray-500'
                          }>
                            {formatarMoeda(op.resultadoTotal)}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMostraResumo(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Estado de carregamento */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando operações...</p>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Lista de operações */}
      {!isLoading && !error && (
        <>
          {operacoes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhuma operação de copytrading encontrada para {mesAtivo}.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abertura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direção</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operacoes.map(op => (
                    <tr 
                      key={op._id} 
                      className={`hover:bg-gray-50 ${
                        op.status === 'Fechada' 
                          ? op.resultadoTotal > 0 
                            ? 'bg-green-50' 
                            : op.resultadoTotal < 0 
                              ? 'bg-red-50' 
                              : '' 
                          : ''
                      }`}
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={cestalSelecionada.includes(op._id)}
                          onChange={() => handleToggleSelecao(op._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-blue-600 hover:text-blue-800 font-medium">
                          {op.ticker || (op.nome ? op.nome : 'N/A')}
                        </div>
                        <div className="flex flex-col text-xs text-gray-500 mt-1">
                          {op.idVisual && <div>{op.idVisual}</div>}
                          {op.userId && op.userId.name && (
                            <div className="text-green-600 font-medium">
                              Modelo: {op.userId.name}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-600">
                          <div>{formatarData(op.dataAbertura)}</div>
                          {op.status === 'Fechada' && op.dataFechamento && (
                            <div className="mt-1 text-xs">
                              Fechada: {formatarData(op.dataFechamento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                          op.tipo === 'CALL' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                          op.direcao === 'COMPRA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {op.direcao}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatarMoeda(op.strike)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          {formatarMoeda(op.preco)}
                          {op.status === 'Fechada' && op.precoFechamento && (
                            <div className="mt-1 text-xs text-gray-500">
                              Fechamento: {formatarMoeda(op.precoFechamento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={op.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          op.resultadoTotal > 0 
                            ? 'text-green-600 font-semibold' 
                            : op.resultadoTotal < 0 
                              ? 'text-red-600 font-semibold' 
                              : 'text-gray-500'
                        }>
                          {formatarMoeda(op.resultadoTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/operacoes/${op._id}`} className="text-blue-600 hover:text-blue-800">
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}