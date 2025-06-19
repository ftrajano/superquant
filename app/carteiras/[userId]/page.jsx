'use client';

import React, { useState, useEffect, Suspense, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import TabSelector from '@/components/ui/TabSelector.jsx';
import YearSelector from '@/components/ui/YearSelector.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/components/ThemeProvider';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);

// Componente principal que usa useSearchParams
const CarteiraContent = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesParam = searchParams.get('mes');
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  
  // Lista de meses válidos para normalização
  const mesesValidos = {
    'janeiro': 'janeiro', 'fevereiro': 'fevereiro', 'marco': 'marco', 
    'abril': 'abril', 'maio': 'maio', 'junho': 'junho',
    'julho': 'julho', 'agosto': 'agosto', 'setembro': 'setembro',
    'outubro': 'outubro', 'novembro': 'novembro', 'dezembro': 'dezembro', 
    'todas': 'todas'
  };
  
  // Normalizar o mês para garantir que seja um dos valores válidos
  const mesAtivo = mesParam ? 
    (mesesValidos[mesParam.toLowerCase()] || 'abril') : 
    'abril';
  
  const anoAtivo = searchParams.get('ano') || new Date().getFullYear().toString();
  
  const [operacoes, setOperacoes] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOperacoes, setIsLoadingOperacoes] = useState(false);
  const [error, setError] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState('Todos');

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
    { value: 'dezembro', label: 'Dezembro' },
    { value: 'todas', label: 'Todas' }
  ];

  // Verificar permissões
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'modelo' && session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Buscar informações do usuário (apenas uma vez)
  useEffect(() => {
    const fetchUsuarioInfo = async () => {
      if (!resolvedParams.userId) return;
      
      setIsLoading(true);
      try {
        const usuariosResponse = await fetch('/api/usuarios');
        if (!usuariosResponse.ok) {
          throw new Error('Erro ao carregar informações do usuário');
        }
        const usuariosData = await usuariosResponse.json();
        const usuario = usuariosData.usuarios.find(u => u._id === resolvedParams.userId);
        
        if (!usuario) {
          throw new Error('Usuário não encontrado');
        }
        setUsuarioInfo(usuario);
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'modelo' || session?.user?.role === 'admin') {
      fetchUsuarioInfo();
    }
  }, [resolvedParams.userId, session]);

  // Buscar operações do usuário (separado para permitir loading independente)
  useEffect(() => {
    const fetchOperacoes = async () => {
      if (!resolvedParams.userId || !usuarioInfo) return;
      
      setIsLoadingOperacoes(true);
      try {
        const queryParams = new URLSearchParams();
        if (mesAtivo && mesAtivo !== 'todas') {
          queryParams.append('mes', mesAtivo);
        }
        queryParams.append('ano', anoAtivo);
        queryParams.append('userId', resolvedParams.userId);

        const operacoesResponse = await fetch(`/api/operacoes/usuario?${queryParams.toString()}`);
        if (!operacoesResponse.ok) {
          throw new Error('Erro ao carregar operações');
        }
        const operacoesData = await operacoesResponse.json();
        setOperacoes(operacoesData.operacoes || []);
      } catch (error) {
        console.error('Erro ao buscar operações:', error);
        setError(error.message);
      } finally {
        setIsLoadingOperacoes(false);
      }
    };

    if (usuarioInfo && (session?.user?.role === 'modelo' || session?.user?.role === 'admin')) {
      fetchOperacoes();
    }
  }, [resolvedParams.userId, mesAtivo, anoAtivo, usuarioInfo, session]);

  // Função para navegar entre meses
  const handleMesChange = (novoMes) => {
    const queryParams = new URLSearchParams();
    queryParams.set('mes', novoMes);
    queryParams.set('ano', anoAtivo);
    router.push(`/carteiras/${resolvedParams.userId}?${queryParams.toString()}`);
  };

  // Função para navegar entre anos
  const handleAnoChange = (novoAno) => {
    const queryParams = new URLSearchParams();
    queryParams.set('mes', mesAtivo);
    queryParams.set('ano', novoAno);
    router.push(`/carteiras/${resolvedParams.userId}?${queryParams.toString()}`);
  };

  // Filtrar operações por status
  const operacoesFiltradas = useMemo(() => {
    let filtradas = operacoes;
    
    if (statusFiltro !== 'Todos') {
      filtradas = filtradas.filter(op => op.status === statusFiltro);
    }
    
    return filtradas;
  }, [operacoes, statusFiltro]);

  // Função de ordenação
  const handleOrdenar = (campo) => {
    setOrdenacao(prev => {
      if (prev.campo === campo) {
        return {
          ...prev,
          direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          campo,
          direcao: 'asc',
          campoPrimario: prev.campo,
          direcaoPrimaria: prev.direcao
        };
      }
    });
  };

  // Aplicar ordenação
  const operacoesOrdenadas = useMemo(() => {
    if (!ordenacao.campo) return operacoesFiltradas;
    
    return [...operacoesFiltradas].sort((a, b) => {
      const valorA = a[ordenacao.campo];
      const valorB = b[ordenacao.campo];
      
      let comparacao = 0;
      if (valorA < valorB) comparacao = -1;
      else if (valorA > valorB) comparacao = 1;
      
      if (ordenacao.direcao === 'desc') comparacao *= -1;
      
      return comparacao;
    });
  }, [operacoesFiltradas, ordenacao]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <LoadingUI />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-500">Erro: {error}</p>
            <Link href="/carteiras" className="text-primary hover:underline mt-4 inline-block">
              ← Voltar para Carteiras
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/carteiras" className="text-primary hover:underline">
                ← Voltar
              </Link>
              <h1 className="text-2xl font-bold text-text-primary">
                Carteira de {usuarioInfo?.name}
              </h1>
            </div>
            <p className="text-text-secondary">
              {usuarioInfo?.email}
            </p>
          </div>
        </div>

        {/* Seletores de Mês e Ano */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <TabSelector
            tabs={meses}
            activeTab={mesAtivo}
            onTabChange={handleMesChange}
          />
          <YearSelector
            currentYear={anoAtivo}
            onYearChange={handleAnoChange}
          />
        </div>

        {/* Filtro de Status */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['Todos', 'Aberta', 'Fechada', 'Parcialmente Fechada'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFiltro(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFiltro === status
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Operações */}
        <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-border">
              <thead className="bg-surface-secondary">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('idVisual')}
                  >
                    ID Visual
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('ticker')}
                  >
                    Ticker
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('tipo')}
                  >
                    Tipo
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('direcao')}
                  >
                    Direção
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('strike')}
                  >
                    Strike
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('preco')}
                  >
                    Preço
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('quantidade')}
                  >
                    Qtd
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('valorTotal')}
                  >
                    Valor Total
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('dataAbertura')}
                  >
                    Data Abertura
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('status')}
                  >
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                    onClick={() => handleOrdenar('resultadoTotal')}
                  >
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-card divide-y divide-surface-border">
                {isLoadingOperacoes ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                        <span className="text-text-secondary">Carregando operações...</span>
                      </div>
                    </td>
                  </tr>
                ) : operacoesOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-text-secondary">
                      Nenhuma operação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  operacoesOrdenadas.map((operacao) => (
                    <tr key={operacao._id} className="hover:bg-surface-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {operacao.idVisual}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {operacao.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {operacao.tipo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          operacao.direcao === 'COMPRA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {operacao.direcao === 'COMPRA' ? '⬆️ COMPRA' : '⬇️ VENDA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {formatCurrency(operacao.strike)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {formatCurrency(operacao.preco)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {operacao.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {formatCurrency(operacao.valorTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {format(new Date(operacao.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={operacao.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {operacao.status === 'Fechada' ? (
                          <span className={operacao.resultadoTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(operacao.resultadoTotal)}
                          </span>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo */}
        {operacoesOrdenadas.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-card p-4 rounded-lg">
              <p className="text-text-secondary text-sm">Total de Operações</p>
              <p className="text-text-primary text-lg font-semibold">{operacoesOrdenadas.length}</p>
            </div>
            <div className="bg-surface-card p-4 rounded-lg">
              <p className="text-text-secondary text-sm">Operações Abertas</p>
              <p className="text-text-primary text-lg font-semibold">
                {operacoesOrdenadas.filter(op => op.status === 'Aberta').length}
              </p>
            </div>
            <div className="bg-surface-card p-4 rounded-lg">
              <p className="text-text-secondary text-sm">Operações Fechadas</p>
              <p className="text-text-primary text-lg font-semibold">
                {operacoesOrdenadas.filter(op => op.status === 'Fechada').length}
              </p>
            </div>
            <div className="bg-surface-card p-4 rounded-lg">
              <p className="text-text-secondary text-sm">Resultado Total</p>
              <p className={`text-lg font-semibold ${
                operacoesOrdenadas.reduce((acc, op) => acc + (op.resultadoTotal || 0), 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(operacoesOrdenadas.reduce((acc, op) => acc + (op.resultadoTotal || 0), 0))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal com Suspense
export default function CarteiraPage({ params }) {
  return (
    <Suspense fallback={<LoadingUI />}>
      <CarteiraContent params={params} />
    </Suspense>
  );
}