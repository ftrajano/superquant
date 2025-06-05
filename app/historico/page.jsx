'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';

export default function HistoricoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Opções para os dropdowns
  const mesesOptions = [
    { value: '', label: 'Todos os meses' },
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

  const anosOptions = [
    { value: '', label: 'Todos os anos' },
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' }
  ];

  // Buscar histórico
  const buscarHistorico = async (novaBusca = busca, novoMes = mes, novoAno = ano, novaPagina = pagina) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        busca: novaBusca,
        pagina: novaPagina.toString(),
        limite: '20'
      });

      if (novoMes) params.append('mes', novoMes);
      if (novoAno) params.append('ano', novoAno);

      const response = await fetch(`/api/historico?${params}`);
      const data = await response.json();


      if (response.ok) {
        setHistorico(data.historico);
        setTotal(data.total);
        setPagina(data.pagina);
        setTotalPaginas(data.totalPaginas);
      } else {
        console.error('Erro ao buscar histórico:', data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico inicial
  useEffect(() => {
    if (status === 'authenticated') {
      buscarHistorico();
    }
  }, [status]);

  // Busca em tempo real e filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'authenticated') {
        buscarHistorico(busca, mes, ano, 1);
        setPagina(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, mes, ano, status]);

  // Formatar data
  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatar valor monetário
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Obter cor do badge baseado no tipo e direção
  const obterCorBadge = (tipo, direcao) => {
    if (tipo === 'CALL') {
      return direcao === 'COMPRA' ? 'success' : 'warning';
    } else {
      return direcao === 'COMPRA' ? 'info' : 'error';
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Histórico de Operações</h1>
            <p className="text-[var(--text-secondary)]">Registro temporal das operações do usuário modelo</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Input
            type="text"
            placeholder="Buscar operação por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 min-w-[250px] max-w-md"
          />
          
          <Select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            options={mesesOptions}
            className="min-w-[180px]"
            placeholder="Selecionar mês"
          />
          
          <Select
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            options={anosOptions}
            className="min-w-[150px]"
            placeholder="Selecionar ano"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Carregando histórico...</p>
          </div>
        )}

        {/* Lista de histórico */}
        {!loading && (
          <>
            {historico.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-text-secondary text-lg">
                  {busca ? 'Nenhuma operação encontrada para a busca.' : 'Nenhuma operação no histórico.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {historico.map((operacao) => (
                  <Card key={operacao._id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Informações principais */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {operacao.nome}
                          </h3>
                          <StatusBadge
                            status={`${operacao.tipo} ${operacao.direcao}`}
                            variant={obterCorBadge(operacao.tipo, operacao.direcao)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-text-secondary">Ticker:</span>
                            <p className="font-medium text-text-primary">{operacao.ticker}</p>
                          </div>
                          <div>
                            <span className="text-text-secondary">Strike:</span>
                            <p className="font-medium text-text-primary">{formatarValor(operacao.strike)}</p>
                          </div>
                          <div>
                            <span className="text-text-secondary">Quantidade:</span>
                            <p className="font-medium text-text-primary">{operacao.quantidade}</p>
                          </div>
                          <div>
                            <span className="text-text-secondary">Preço:</span>
                            <p className="font-medium text-text-primary">{formatarValor(operacao.preco)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Data e informações extras */}
                      <div className="text-right lg:text-left lg:min-w-[200px]">
                        <p className="text-sm text-text-secondary mb-1">
                          {formatarData(operacao.dataOperacao)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {operacao.mesReferencia} {operacao.anoReferencia}
                        </p>
                        <p className="text-sm font-medium text-text-primary mt-1">
                          Total: {formatarValor(operacao.preco * operacao.quantidade)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => {
                        const novaPagina = pagina - 1;
                        setPagina(novaPagina);
                        buscarHistorico(busca, mes, ano, novaPagina);
                      }}
                      disabled={pagina === 1}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
                    >
                      Anterior
                    </button>

                    <span className="text-sm text-text-secondary">
                      Página {pagina} de {totalPaginas} ({total} operações)
                    </span>

                    <button
                      onClick={() => {
                        const novaPagina = pagina + 1;
                        setPagina(novaPagina);
                        buscarHistorico(busca, mes, ano, novaPagina);
                      }}
                      disabled={pagina === totalPaginas}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}