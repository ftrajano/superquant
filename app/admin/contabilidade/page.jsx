'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function RelatorioContabil() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [relatorios, setRelatorios] = useState([]);
  const [assinaturasPendentes, setAssinaturasPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [periodoAtual, setPeriodoAtual] = useState(null);

  // Verificar autorização
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'modelo')) {
      router.push('/');
      return;
    }

    carregarDados();
  }, [session, status, router]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar relatórios contábeis existentes
      const relatoriosResponse = await fetch('/api/admin/contabilidade');
      const relatoriosData = await relatoriosResponse.json();

      if (relatoriosResponse.ok) {
        setRelatorios(relatoriosData.relatorios || []);
        setAssinaturasPendentes(relatoriosData.assinaturasPendentes || []);
        setPeriodoAtual(relatoriosData.periodoAtual);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fecharContabilidade = async () => {
    if (!confirm('Tem certeza que deseja fechar a contabilidade do período atual? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setProcessando(true);

      const response = await fetch('/api/admin/contabilidade/fechar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Contabilidade fechada com sucesso! Total faturado: R$ ${result.relatorio.totalFaturado.toFixed(2)}`);
        await carregarDados();
      } else {
        alert('Erro: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao fechar contabilidade:', error);
      alert('Erro ao processar solicitação');
    } finally {
      setProcessando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Relatório Contábil</h1>
            <p className="text-[var(--text-secondary)]">Controle financeiro das assinaturas</p>
          </div>

          {assinaturasPendentes.length > 0 && (
            <button
              onClick={fecharContabilidade}
              disabled={processando}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold px-6 py-3 rounded disabled:opacity-50"
            >
              {processando ? 'Processando...' : `Fechar Contabilidade (${assinaturasPendentes.length} pendentes)`}
            </button>
          )}
        </div>

        {/* Assinaturas Pendentes */}
        {assinaturasPendentes.length > 0 && (
          <div className="bg-[var(--surface-card)] rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Assinaturas Pendentes - Próximo Fechamento ({assinaturasPendentes.length})
            </h2>

            {periodoAtual && (
              <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
                <strong>Período atual:</strong> Desde {formatarData(periodoAtual.inicio)} até agora
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {['monthly', 'quarterly', 'yearly'].map(plano => {
                const assinaturas = assinaturasPendentes.filter(a => a.plano === plano);
                const total = assinaturas.reduce((acc, a) => acc + a.valor, 0);
                const planNames = {
                  monthly: 'Mensal',
                  quarterly: 'Trimestral',
                  yearly: 'Anual'
                };

                return (
                  <div key={plano} className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium text-gray-700">{planNames[plano]}</h3>
                    <p className="text-sm text-gray-600">{assinaturas.length} assinaturas</p>
                    <p className="text-lg font-bold text-green-600">{formatarMoeda(total)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Bruto:</span>
                <span className="text-green-600">
                  {formatarMoeda(assinaturasPendentes.reduce((acc, a) => acc + a.valor, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-md">
                <span>Impostos (6%):</span>
                <span className="text-red-600">
                  {formatarMoeda(assinaturasPendentes.reduce((acc, a) => acc + a.valor, 0) * 0.06)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total Líquido:</span>
                <span className="text-blue-600">
                  {formatarMoeda(assinaturasPendentes.reduce((acc, a) => acc + a.valor, 0) * 0.94)}
                </span>
              </div>
              <div className="flex justify-between items-center text-md text-purple-600">
                <span>Parcial de 50%:</span>
                <span className="font-semibold">
                  {formatarMoeda(assinaturasPendentes.reduce((acc, a) => acc + a.valor, 0) * 0.94 * 0.5)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Relatórios */}
        <div className="bg-[var(--surface-card)] rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Histórico de Relatórios Contábeis</h2>

          {relatorios.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum relatório contábil encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Fechamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período Abrangido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trimestral
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Bruto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impostos (6%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Líquido
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorios.map((relatorio) => (
                    <tr key={relatorio._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(relatorio.dataFechamento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(relatorio.periodoInicio)} até {formatarData(relatorio.periodoFim)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{relatorio.breakdown.monthly.quantidade}x</div>
                          <div className="text-gray-500">{formatarMoeda(relatorio.breakdown.monthly.total)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{relatorio.breakdown.quarterly.quantidade}x</div>
                          <div className="text-gray-500">{formatarMoeda(relatorio.breakdown.quarterly.total)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{relatorio.breakdown.yearly.quantidade}x</div>
                          <div className="text-gray-500">{formatarMoeda(relatorio.breakdown.yearly.total)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatarMoeda(relatorio.totalFaturado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatarMoeda(relatorio.impostos)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatarMoeda(relatorio.totalLiquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}