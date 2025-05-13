'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MargemPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [margemData, setMargemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [historicoExpandido, setHistoricoExpandido] = useState(false);
  
  // Estados do formulário de transação
  const [formData, setFormData] = useState({
    margemTotal: '',
    descricao: ''
  });
  // Estado removido pois não é mais necessário
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);
  
  // Carregar dados da margem ao iniciar
  useEffect(() => {
    const fetchMargemData = async () => {
      if (status !== 'authenticated') {
        console.log('Usuário não autenticado, não buscando dados de margem');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/margem');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados de margem');
        }
        
        const data = await response.json();
        console.log('Dados de margem recebidos:', data);
        setMargemData(data);
      } catch (err) {
        console.error('Erro ao buscar dados de margem:', err);
        setError('Não foi possível carregar os dados de margem. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMargemData();
  }, [status]);
  
  // Atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Enviar o formulário para atualizar a margem total
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validar dados antes de enviar
      if (!formData.margemTotal || isNaN(parseFloat(formData.margemTotal))) {
        throw new Error('Valor da margem total é obrigatório e deve ser um número válido');
      }
      
      // Verificar se a margem total é suficiente para cobrir a margem já utilizada
      if (margemData && parseFloat(formData.margemTotal) < margemData.margemUtilizada) {
        throw new Error(`A margem total deve ser maior ou igual à margem utilizada (${formatarMoeda(margemData.margemUtilizada)})`);
      }
      
      const valorNovo = parseFloat(formData.margemTotal);
      
      // Preparar os dados para enviar
      const dadosAtualizacao = {
        tipo: 'ajuste',  // Usamos ajuste para atualizar diretamente o valor da margem
        valor: valorNovo,
        descricao: formData.descricao || 'Atualização de margem total'
      };
      
      const response = await fetch('/api/margem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAtualizacao),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar margem');
      }
      
      // Atualizar dados locais
      setMargemData(data);
      
      // Resetar formulário
      setFormData({
        margemTotal: '',
        descricao: ''
      });
      setShowForm(false);
      
      // Mostrar mensagem de sucesso
      alert('Margem total atualizada com sucesso!');
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar a margem. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formatar data
  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
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
  
  // Traduzir tipo de transação
  const traduzirTipo = (tipo) => {
    switch (tipo) {
      case 'deposito': return 'Depósito';
      case 'saque': return 'Saque';
      case 'ajuste': return 'Ajuste Manual';
      case 'configuracao_inicial': return 'Configuração Inicial';
      default: return tipo;
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Controle de Margem</h1>
            <p className="text-[var(--text-secondary)]">Gerenciamento de margem na corretora</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-[var(--primary)] text-white dark:text-black font-bold px-4 py-2 rounded hover:bg-[var(--primary-hover)]"
            >
              {showForm ? 'Cancelar' : 'Atualizar Margem Total'}
            </button>
            <Link 
              href="/operacoes" 
              className="bg-[var(--surface-tertiary)] text-[var(--text-primary)] px-4 py-2 rounded hover:bg-[var(--surface-tonal-hover)]"
            >
              Voltar para Operações
            </Link>
          </div>
        </div>
        
        {/* Estado de carregamento */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Carregando dados de margem...</p>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Formulário para atualizar margem total */}
        {showForm && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-[var(--primary)] mb-4">Atualizar Margem Total</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="margemTotal">
                  Margem Total Disponível
                </label>
                <input
                  id="margemTotal"
                  name="margemTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ex: 10000.00"
                  value={formData.margemTotal}
                  onChange={handleChange}
                  required
                />
                {margemData && margemData.margemUtilizada > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    Margem utilizada atual: {formatarMoeda(margemData.margemUtilizada)}
                    {Number(formData.margemTotal) < margemData.margemUtilizada && (
                      <span className="block mt-1 text-red-600 font-semibold">
                        Atenção: O valor deve ser maior que a margem utilizada!
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descricao">
                  Observações (opcional)
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="2"
                  placeholder="Motivo da alteração de margem..."
                  value={formData.descricao}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSubmitting || (Number(formData.margemTotal) < (margemData?.margemUtilizada || 0))}
                >
                  {isSubmitting ? 'Processando...' : 'Atualizar Margem'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-block align-baseline font-bold text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Primeira configuração de margem - mostrado apenas quando não há margem configurada */}
        {!isLoading && !error && margemData && margemData.margemTotal === 0 && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-[var(--primary)] mb-4">Configuração Inicial de Margem</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Você ainda não configurou sua margem inicial. Configure o valor total da sua margem disponível na corretora para começar.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="valor">
                  Valor Inicial da Margem
                </label>
                <input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ex: 5000.00"
                  value={formData.margemTotal}
                  onChange={(e) => setFormData({
                    ...formData,
                    margemTotal: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descricao">
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="2"
                  placeholder="Ex: Valor inicial da conta na corretora..."
                  value={formData.descricao}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Configurando...' : 'Configurar Margem Inicial'}
              </button>
            </form>
          </div>
        )}
        
        {/* Exibir dados de margem - apenas quando já há margem configurada */}
        {!isLoading && !error && margemData && margemData.margemTotal > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Margem Total */}
            <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">Margem Total</h3>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{formatarMoeda(margemData.margemTotal)}</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">Valor total de margem depositada na corretora</p>
            </div>
            
            {/* Margem Utilizada */}
            <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">Margem Utilizada</h3>
              <p className="text-3xl font-bold text-[var(--warning)]">{formatarMoeda(margemData.margemUtilizada)}</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">
                Valor de margem alocada para operações abertas
              </p>
            </div>
            
            {/* Margem Disponível */}
            <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">Margem Disponível</h3>
              <p className="text-3xl font-bold text-[var(--success)]">{formatarMoeda(margemData.margemDisponivel)}</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">Valor de margem disponível para novas operações</p>
            </div>
          </div>
        )}
        
        {/* Removido o componente duplicado "Detalhamento da Margem Utilizada" */}
        
        {/* Gráfico de uso da margem - a ser implementado */}
        {!isLoading && !error && margemData && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-[var(--primary)] mb-4">Uso da Margem</h3>
            
            <div className="w-full bg-[var(--surface-secondary)] rounded-full h-4 mb-2">
              <div 
                className="bg-[var(--primary)] h-4 rounded-full" 
                style={{ 
                  width: `${margemData.margemTotal > 0 ? (margemData.margemUtilizada / margemData.margemTotal) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Utilizado: {margemData.margemTotal > 0 ? Math.round((margemData.margemUtilizada / margemData.margemTotal) * 100) : 0}%</span>
              <span>Disponível: {margemData.margemTotal > 0 ? Math.round((margemData.margemDisponivel / margemData.margemTotal) * 100) : 0}%</span>
            </div>
          </div>
        )}
        
        {/* Detalhamento da Utilização de Margem por Operação */}
        {!isLoading && !error && margemData && margemData.detalhesOperacoes && margemData.detalhesOperacoes.length > 0 && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--primary)]">Operações Utilizando Margem</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--surface-border)]">
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Ticker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Direção</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Quantidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Margem Utilizada</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                  {margemData.detalhesOperacoes.map((op) => (
                    <tr key={op.id} className="hover:bg-[var(--surface-secondary)] dark:hover:bg-[var(--surface-tertiary)]">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--primary)]">
                        {op.ticker}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                          op.status === 'Aberta' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {op.status === 'Parcialmente Fechada' 
                          ? `${op.quantidadeRestante}/${op.quantidade} restantes` 
                          : op.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {formatarData(op.dataAbertura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--warning)]">
                        {formatarMoeda(op.valorMargem)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--surface-secondary)]">
                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-right font-bold text-[var(--text-primary)]">
                      Total de Margem Utilizada:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--warning)]">
                      {formatarMoeda(margemData.margemUtilizada)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Estado sem operações */}
        {!isLoading && !error && margemData && (!margemData.detalhesOperacoes || margemData.detalhesOperacoes.length === 0) && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">Operações com Margem</h3>
            <p className="text-[var(--text-secondary)] py-4">Nenhuma operação utilizando margem no momento.</p>
            <Link 
              href="/operacoes/nova"
              className="mt-2 inline-block bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold px-4 py-2 rounded"
              style={{
                backgroundColor: "var(--primary)",
                color: "white"
              }}
            >
              Criar Nova Operação
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}