'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import TabSelector from '@/components/ui/TabSelector.jsx';
import YearSelector from '@/components/ui/YearSelector.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
    <p className="text-[var(--text-secondary)]">Carregando...</p>
  </div>
);

// Componente principal com useSearchParams dentro do Suspense
const SuperQuantIAContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesAtivo = searchParams.get('mes') || (() => {
    const agora = new Date();
    const mesAtual = agora.getMonth(); // 0-11
    const mesesArray = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return mesesArray[mesAtual];
  })();
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
  
  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState({
    campo: null,
    direcao: 'asc',
    campoPrimario: null,
    direcaoPrimaria: 'asc'
  });
  
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
  
  const calcularValorOperacoesAbertas = () => {
    // Filtra apenas operações abertas deste mês e ano
    const operacoesAbertas = operacoes.filter(op => {
      // Verificação básica de status
      if (op.status !== 'Aberta') return false;
      
      // Filtrar pelo mês e ano específicos
      return op.mesReferencia?.toLowerCase() === mesAtivo?.toLowerCase() && 
             op.anoReferencia?.toString() === anoAtivo?.toString();
    });
    
    // Calcula o valor total das operações abertas com base na direção
    return operacoesAbertas.reduce((total, op) => {
      // Para compras, consideramos o valor negativo, para vendas positivo
      const valor = (op.direcao === 'COMPRA' ? -1 : 1) * (op.valorTotal || op.preco * (op.quantidade || 1) || 0);
      return total + valor;
    }, 0);
  };
  
  const calcularSaldoCesta = () => {
    const operacoesDaCesta = operacoes.filter(op => 
      cestalSelecionada.includes(op._id) && op.status === 'Aberta'
    );
    
    // Calcula o valor total das operações abertas com base na direção
    return operacoesDaCesta.reduce((total, op) => {
      // Para compras, consideramos o valor negativo, para vendas positivo
      const valor = (op.direcao === 'COMPRA' ? -1 : 1) * (op.valorTotal || op.preco * (op.quantidade || 1) || 0);
      return total + valor;
    }, 0);
  };
  
  const limparCesta = () => {
    setCestaSeleccionada([]);
    setMostraResumo(false);
  };
  
  // Função para ordenar operações
  const handleSort = (campo) => {
    setOrdenacao(prev => {
      // Se o campo for o mesmo que já está ordenado, inverte a direção
      if (prev.campo === campo) {
        return {
          ...prev,
          direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
        };
      }
      
      // Se for uma nova coluna, verifica se já temos uma ordenação primária
      if (prev.campo && prev.campo !== campo) {
        // Salva a ordenação atual como primária e define a nova como secundária
        return {
          campoPrimario: prev.campo,
          direcaoPrimaria: prev.direcao,
          campo,
          direcao: 'asc'
        };
      }
      
      // Caso seja a primeira ordenação
      return {
        ...prev,
        campo,
        direcao: 'asc',
        campoPrimario: null,
        direcaoPrimaria: 'asc'
      };
    });
  };
  
  // Função para aplicar a ordenação na lista de operações
  const operacoesOrdenadas = useMemo(() => {
    if (!ordenacao.campo) return operacoes;

    return [...operacoes].sort((a, b) => {
      // Compara pelo campo primário (se existir)
      if (ordenacao.campoPrimario) {
        let valorPrimarioA, valorPrimarioB;
        
        switch (ordenacao.campoPrimario) {
          case 'tipo':
            valorPrimarioA = a.tipo || '';
            valorPrimarioB = b.tipo || '';
            break;
          case 'strike':
            valorPrimarioA = a.strike || 0;
            valorPrimarioB = b.strike || 0;
            break;
          default:
            valorPrimarioA = 0;
            valorPrimarioB = 0;
        }
        
        // Se forem diferentes pelo critério primário, retorna a comparação
        if (typeof valorPrimarioA === 'string' && typeof valorPrimarioB === 'string') {
          const comparacao = ordenacao.direcaoPrimaria === 'asc'
            ? valorPrimarioA.localeCompare(valorPrimarioB, 'pt-BR', { sensitivity: 'base' })
            : valorPrimarioB.localeCompare(valorPrimarioA, 'pt-BR', { sensitivity: 'base' });
          
          if (comparacao !== 0) return comparacao;
        } else if (valorPrimarioA !== valorPrimarioB) {
          return ordenacao.direcaoPrimaria === 'asc' 
            ? valorPrimarioA - valorPrimarioB 
            : valorPrimarioB - valorPrimarioA;
        }
      }
      
      // Se são iguais pelo critério primário ou não há critério primário, compara pelo critério secundário
      let valorA, valorB;

      switch (ordenacao.campo) {
        case 'tipo':
          valorA = a.tipo || '';
          valorB = b.tipo || '';
          break;
        case 'strike':
          valorA = a.strike || 0;
          valorB = b.strike || 0;
          break;
        default:
          return 0;
      }

      // Comparação com suporte a ordenação ascendente e descendente
      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenacao.direcao === 'asc'
          ? valorA.localeCompare(valorB, 'pt-BR', { sensitivity: 'base' })
          : valorB.localeCompare(valorA, 'pt-BR', { sensitivity: 'base' });
      } else {
        return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
      }
    });
  }, [operacoes, ordenacao]);
  
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
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">SuperQuant.IA</h1>
          <p className="text-[var(--text-secondary)]">Operações dos usuários modelo para você se inspirar</p>
          <div className="mt-2 text-sm text-[var(--text-tertiary)]">
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
        <div className="flex items-center space-x-4">
          <div className="inline-flex shadow-sm rounded-md">
            <button
              type="button"
              onClick={() => setStatusFiltro('Todos')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                statusFiltro === 'Todos' 
                  ? 'bg-[var(--primary)] text-white dark:text-[var(--color-dark-900)]' 
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFiltro('Aberta')}
              className={`px-4 py-2 text-sm font-medium ${
                statusFiltro === 'Aberta' 
                  ? 'bg-[var(--primary)] text-white dark:text-[var(--color-dark-900)]' 
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Abertas
            </button>
            <button
              type="button"
              onClick={() => setStatusFiltro('Fechada')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                statusFiltro === 'Fechada' 
                  ? 'bg-[var(--primary)] text-white dark:text-[var(--color-dark-900)]' 
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Fechadas
            </button>
          </div>
          
          {/* Valor das operações abertas no mês */}
          <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
            <div className="mr-2 text-xs text-[var(--text-secondary)]">Valor operações abertas:</div>
            <div 
              className="font-semibold text-sm"
              style={{
                color: calcularValorOperacoesAbertas() > 0 
                  ? '#16a34a' 
                  : calcularValorOperacoesAbertas() < 0 
                    ? '#dc2626' 
                    : '#6b7280'
              }}
            >
              {formatarMoeda(calcularValorOperacoesAbertas())}
            </div>
          </div>
          
          {/* Valor das operações abertas selecionadas */}
          <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
            <div className="mr-2 text-xs text-[var(--text-secondary)]">Valor operações selecionadas:</div>
            <div 
              className="font-semibold text-sm"
              style={{
                color: calcularSaldoCesta() > 0 
                  ? '#16a34a' 
                  : calcularSaldoCesta() < 0 
                    ? '#dc2626' 
                    : '#6b7280'
              }}
            >
              {formatarMoeda(calcularSaldoCesta())}
            </div>
          </div>
        </div>
        
        {/* Ações da Cesta */}
        <div className="flex gap-2">
          {cestalSelecionada.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setMostraResumo(true)}
                className="bg-[var(--primary)] text-white dark:text-[var(--color-dark-900)] px-3 py-1 rounded text-sm hover:bg-[var(--primary-hover)]"
              >
                Ver Resumo ({cestalSelecionada.length})
              </button>
              <button
                type="button"
                onClick={limparCesta}
                className="bg-[var(--surface-secondary)] text-[var(--text-primary)] px-3 py-1 rounded text-sm hover:bg-[var(--surface-tertiary)]"
              >
                Limpar Seleção
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Resumo da Cesta */}
      {mostraResumo && (
        <div className="fixed inset-0 bg-[var(--color-dark-900)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-[var(--primary)] mb-4">Resumo da Cesta</h2>
            <div className="mb-4">
              <p className="text-lg font-bold mb-2">
                Operações selecionadas: {cestalSelecionada.length}
              </p>
              <p className="text-xl font-bold">
                Saldo total: 
                <span className={
                  calcularSaldoCesta() > 0 
                    ? ' text-[var(--success)]' 
                    : calcularSaldoCesta() < 0 
                      ? ' text-[var(--error)]' 
                      : ''
                }>
                  {' '}{formatarMoeda(calcularSaldoCesta())}
                </span>
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-[var(--surface-border)]">
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Ticker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Resultado</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                  {operacoes
                    .filter(op => cestalSelecionada.includes(op._id))
                    .map(op => (
                      <tr key={`cesta-${op._id}`}>
                        <td className="px-3 py-2 text-sm">
                          {op.ticker || (op.nome ? op.nome : 'N/A')}
                          {op.idVisual && (
                            <div className="text-xs text-[var(--text-tertiary)]">{op.idVisual}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{op.tipo} {op.direcao === 'COMPRA' ? '↑' : '↓'}</td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <span className={
                            op.resultadoTotal > 0 
                              ? 'text-[var(--success)]' 
                              : op.resultadoTotal < 0 
                                ? 'text-[var(--error)]' 
                                : 'text-[var(--text-tertiary)]'
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
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-[var(--color-dark-900)] font-medium py-2 px-4 rounded"
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
          <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Carregando operações...</p>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Lista de operações */}
      {!isLoading && !error && (
        <>
          {operacoes.length === 0 ? (
            <div className="text-center py-8 bg-[var(--surface-secondary)] rounded-lg">
              <p className="text-[var(--text-secondary)]">Nenhuma operação do SuperQuant.IA encontrada para {mesAtivo}.</p>
            </div>
          ) : (
            <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-[var(--surface-border)]">
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Sel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Ticker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Abertura</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('tipo')}
                    >
                      <div className="flex items-center">
                        Tipo
                        {ordenacao.campo === 'tipo' && (
                          <span className="ml-1 text-[var(--primary)]">
                            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                        {ordenacao.campoPrimario === 'tipo' && (
                          <span className="ml-1 text-[var(--text-tertiary)]">
                            {ordenacao.direcaoPrimaria === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Direção</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('strike')}
                    >
                      <div className="flex items-center">
                        Strike
                        {ordenacao.campo === 'strike' && (
                          <span className="ml-1 text-[var(--primary)]">
                            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                        {ordenacao.campoPrimario === 'strike' && (
                          <span className="ml-1 text-[var(--text-tertiary)]">
                            {ordenacao.direcaoPrimaria === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Qtde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                  {operacoesOrdenadas.map(op => (
                    <tr 
                      key={op._id} 
                      className={`hover:bg-[var(--surface-secondary)] dark:hover:bg-[var(--surface-tertiary)] ${
                        op.status === 'Fechada' 
                          ? op.resultadoTotal > 0 
                            ? 'bg-[var(--success)]/10 dark:bg-[var(--success)]/20' 
                            : op.resultadoTotal < 0 
                              ? 'bg-[var(--error)]/10 dark:bg-[var(--error)]/20' 
                              : '' 
                          : ''
                      }`}
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={cestalSelecionada.includes(op._id)}
                          onChange={() => handleToggleSelecao(op._id)}
                          className="h-4 w-4 text-[var(--primary)] border-[var(--surface-border)] rounded focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                          {op.ticker || (op.nome ? op.nome : 'N/A')}
                        </div>
                        <div className="flex flex-col text-xs text-[var(--text-tertiary)] mt-1">
                          {op.idVisual && <div>{op.idVisual}</div>}
                          {op.userId && op.userId.name && (
                            <div className="text-[var(--success)] font-medium">
                              Modelo: {op.userId.name}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-[var(--text-secondary)]">
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
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
                            : 'bg-[var(--surface-secondary)] dark:bg-[var(--surface-tertiary)] text-[var(--text-secondary)] dark:text-[var(--text-primary)]'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                          op.direcao === 'COMPRA' 
                            ? 'bg-[var(--success)]/10 text-[var(--success)]' 
                            : 'bg-[var(--error)]/10 text-[var(--error)]'
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
                            <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                              Fechamento: {formatarMoeda(op.precoFechamento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {op.quantidade || '1'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatarMoeda(
                          (op.direcao === 'COMPRA' ? -1 : 1) * 
                          (op.valorTotal || (op.preco || 0) * (op.quantidade || 1))
                        )}
                        {op.status === 'Fechada' && op.precoFechamento && (
                          <div className="text-xs text-[var(--text-tertiary)]">
                            F: {formatarMoeda(
                              (op.direcao === 'VENDA' ? -1 : 1) * 
                              (op.valorTotalFechamento || op.precoFechamento * (op.quantidade || 1))
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={op.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          op.resultadoTotal > 0 
                            ? 'text-[var(--success)] font-semibold' 
                            : op.resultadoTotal < 0 
                              ? 'text-[var(--error)] font-semibold' 
                              : 'text-[var(--text-tertiary)]'
                        }>
                          {formatarMoeda(op.resultadoTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/operacoes/${op._id}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)]">
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

// Componente wrapper com Suspense
export default function SuperQuantIAPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <SuperQuantIAContent />
    </Suspense>
  );
}