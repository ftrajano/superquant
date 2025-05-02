'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Button, Badge } from '@/components/ui';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);

// Componente para exibir as pernas da operação (legs)
const OperacaoLegs = ({ legs }) => {
  if (!legs || legs.length === 0) return null;
  
  // Formatar valor monetário
  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };
  
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Pernas Adicionais</h2>
      <div className="bg-surface-bg/60 border border-surface-border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-surface-border">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Tipo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Direção</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Strike</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Preço</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Quantidade</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {legs.map((leg, index) => (
              <tr key={leg._id || index} className="hover:bg-surface-secondary/50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  {leg.tipo === 'Compra' ? 'CALL' : 'PUT'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                    leg.tipo === 'Compra' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {leg.tipo}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  {formatarMoeda(leg.strike)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  <div>
                    {formatarMoeda(leg.precoEntrada)}
                    {leg.status === 'Fechada' && leg.precoSaida && (
                      <div className="text-xs text-text-tertiary">
                        F: {formatarMoeda(leg.precoSaida)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  {leg.quantidade || 1}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                    leg.status === 'Aberta' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {leg.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente principal
const OperacaoDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [operacao, setOperacao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Carregar detalhes da operação
  useEffect(() => {
    const fetchOperacao = async () => {
      if (status !== 'authenticated') {
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/operacoes/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Falha ao buscar operação: ${response.status}`);
        }
        
        const data = await response.json();
        setOperacao(data);
      } catch (err) {
        console.error('Erro ao buscar operação:', err);
        setError('Não foi possível carregar os detalhes da operação.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOperacao();
  }, [params.id, status]);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);
  
  // Formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '—';
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
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };
  
  if (isLoading) {
    return <LoadingUI />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Button href="/operacoes" variant="outline">
            ← Voltar para Operações
          </Button>
        </div>
      </div>
    );
  }
  
  if (!operacao) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-surface-bg border border-surface-border rounded-lg p-6 text-center">
            <p className="text-text-secondary mb-4">Operação não encontrada ou você não tem permissão para visualizá-la.</p>
            <Button href="/operacoes" variant="outline">
              ← Voltar para Operações
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-theme-background">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              href="/operacoes" 
              variant="outline"
              className="mr-4"
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold text-text-primary">
              {operacao.ticker} 
              {operacao.isSpread && (
                <span className="ml-2 text-sm px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Spread
                </span>
              )}
            </h1>
            <div className="ml-3">
              <Badge variant={operacao.status === 'Aberta' ? 'info' : operacao.status === 'Fechada' ? 'success' : 'warning'}>
                {operacao.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              href={`/operacoes/editar/${operacao._id}`}
              variant="secondary"
            >
              Editar
            </Button>
            {operacao.status === 'Aberta' && (
              <Button variant="primary">
                Fechar Operação
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-3">Detalhes da Operação</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">ID Visual</p>
                  <p className="font-medium">{operacao.idVisual || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary">Ticker</p>
                  <p className="font-medium">{operacao.ticker}</p>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary">Mês/Ano de Referência</p>
                  <p className="font-medium">
                    {operacao.mesReferencia.charAt(0).toUpperCase() + operacao.mesReferencia.slice(1)} / {operacao.anoReferencia}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Tipo</p>
                    <p className="font-medium">{operacao.tipo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-text-secondary">Direção</p>
                    <p className="font-medium">{operacao.direcao}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Strike</p>
                    <p className="font-medium">{formatarMoeda(operacao.strike)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-text-secondary">Quantidade</p>
                    <p className="font-medium">{operacao.quantidade || 1}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Preço de Abertura</p>
                    <p className="font-medium">{formatarMoeda(operacao.preco)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-text-secondary">Preço de Fechamento</p>
                    <p className="font-medium">{formatarMoeda(operacao.precoFechamento)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Data de Abertura</p>
                    <p className="font-medium">{formatarData(operacao.dataAbertura)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-text-secondary">Data de Fechamento</p>
                    <p className="font-medium">{formatarData(operacao.dataFechamento)}</p>
                  </div>
                </div>
                
                {operacao.margemUtilizada > 0 && (
                  <div>
                    <p className="text-sm text-text-secondary">Margem Utilizada</p>
                    <p className="font-medium">{formatarMoeda(operacao.margemUtilizada)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">Resumo Financeiro</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Valor Total Investido</p>
                  <p className="font-medium">{formatarMoeda(operacao.valorTotal)}</p>
                </div>
                
                {operacao.status === 'Fechada' && (
                  <>
                    <div>
                      <p className="text-sm text-text-secondary">Resultado</p>
                      <p className={`font-semibold ${
                        operacao.resultadoTotal > 0 
                          ? 'text-green-600' 
                          : operacao.resultadoTotal < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {formatarMoeda(operacao.resultadoTotal)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-secondary">Retorno Percentual</p>
                      <p className={`font-semibold ${
                        operacao.resultadoTotal > 0 
                          ? 'text-green-600' 
                          : operacao.resultadoTotal < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {operacao.valorTotal && operacao.resultadoTotal 
                          ? `${((operacao.resultadoTotal / operacao.valorTotal) * 100).toFixed(2)}%` 
                          : '—'
                        }
                      </p>
                    </div>
                  </>
                )}
                
                {operacao.observacoes && (
                  <div className="mt-4 p-4 bg-surface-secondary/50 rounded-lg">
                    <p className="text-sm font-medium text-text-secondary mb-1">Observações</p>
                    <p className="text-text-primary whitespace-pre-line">{operacao.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Exibir pernas da operação se for um spread */}
          {operacao.isSpread && operacao.legs && <OperacaoLegs legs={operacao.legs} />}
        </Card>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function OperacaoDetailPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <OperacaoDetailContent />
    </Suspense>
  );
}