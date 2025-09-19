'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export default function EditarOperacaoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id } = params;

  const [operacao, setOperacao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    ticker: '',
    tipo: 'CALL',
    direcao: 'COMPRA',
    strike: '',
    preco: '',
    quantidade: '1',
    margemUtilizada: '',
    observacoes: '',
    dataAbertura: '',
    dataFechamento: '',
    corEstrategia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Carregar dados da operação
  useEffect(() => {
    const fetchOperacao = async () => {
      if (status !== 'authenticated' || !id) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/operacoes/${id}`);

        if (!response.ok) {
          throw new Error('Falha ao buscar dados da operação');
        }

        const data = await response.json();
        console.log('Operação carregada:', data);
        setOperacao(data);

        // Formatar datas para input type="date"
        const formatarDataParaInput = (dataString) => {
          if (!dataString) return '';
          const data = new Date(dataString);
          return data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        };

        // Preencher o formulário com os dados da operação
        setFormData({
          ticker: data.ticker || '',
          tipo: data.tipo || 'CALL',
          direcao: data.direcao || 'COMPRA',
          strike: data.strike ? data.strike.toString() : '',
          preco: data.preco ? data.preco.toString() : '',
          quantidade: data.quantidade ? data.quantidade.toString() : '1',
          margemUtilizada: data.margemUtilizada ? data.margemUtilizada.toString() : '',
          observacoes: data.observacoes || '',
          mesReferencia: data.mesReferencia,
          anoReferencia: data.anoReferencia,
          dataAbertura: formatarDataParaInput(data.dataAbertura),
          dataFechamento: formatarDataParaInput(data.dataFechamento),
          corEstrategia: data.corEstrategia || ''
        });
      } catch (err) {
        console.error('Erro ao buscar operação:', err);
        setError('Não foi possível carregar a operação. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperacao();
  }, [id, status]);

  // Atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar dados antes de enviar
      if (!formData.ticker.trim()) {
        throw new Error('Ticker é obrigatório');
      }

      if (!formData.strike || isNaN(parseFloat(formData.strike))) {
        throw new Error('Strike é obrigatório e deve ser um número válido');
      }

      if (!formData.preco || isNaN(parseFloat(formData.preco))) {
        throw new Error('Preço é obrigatório e deve ser um número válido');
      }

      if (!formData.quantidade || isNaN(parseInt(formData.quantidade)) || parseInt(formData.quantidade) <= 0) {
        throw new Error('Quantidade é obrigatória e deve ser um número positivo');
      }

      // Calcular valor total automaticamente
      const preco = parseFloat(formData.preco);
      const quantidade = parseInt(formData.quantidade);
      const valorTotal = preco * quantidade;

      const operacaoAtualizada = {
        ticker: formData.ticker.trim(),
        tipo: formData.tipo,
        direcao: formData.direcao,
        strike: parseFloat(formData.strike),
        preco: preco,
        quantidade: quantidade,
        valorTotal: valorTotal, // ✅ Adicionar valor total calculado
        margemUtilizada: formData.margemUtilizada ? parseFloat(formData.margemUtilizada) : 0,
        observacoes: formData.observacoes || '',
        corEstrategia: formData.corEstrategia || null,
        // Incluir datas apenas se foram fornecidas
        ...(formData.dataAbertura && { dataAbertura: new Date(`${formData.dataAbertura}T12:00:00Z`) }),
        ...(formData.dataFechamento && { dataFechamento: new Date(`${formData.dataFechamento}T12:00:00Z`) })
      };

      console.log('Enviando atualização:', operacaoAtualizada);

      const response = await fetch(`/api/operacoes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operacaoAtualizada),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar operação');
      }

      // Redirecionar para a página de operações
      router.push('/operacoes');
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar a operação. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar valor monetário para exibição
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
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Editar Operação</h1>
            <p className="text-[var(--text-secondary)]">Atualize os detalhes da operação</p>
          </div>
          <Link 
            href="/operacoes" 
            className="bg-[var(--surface-tertiary)] text-[var(--text-primary)] px-4 py-2 rounded hover:bg-[var(--surface-tonal-hover)]"
          >
            Voltar para Operações
          </Link>
        </div>

        {/* Estado de carregamento */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Carregando dados da operação...</p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulário de edição */}
        {!isLoading && !error && operacao && (
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              {operacao.status === 'Fechada' && (
                <div className="mb-4 p-4 bg-[var(--warning)]/10 border-l-4 border-[var(--warning)] text-[var(--warning)]">
                  <p className="font-medium">Atenção: esta operação já está fechada.</p>
                  <p className="text-sm">Algumas alterações podem não ser aplicáveis.</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ticker">
                      Ticker
                    </label>
                    <input
                      id="ticker"
                      name="ticker"
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Ex: PETR4"
                      value={formData.ticker}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">
                        Tipo
                      </label>
                      <select
                        id="tipo"
                        name="tipo"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.tipo}
                        onChange={handleChange}
                        required
                      >
                        <option value="CALL">CALL</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="direcao">
                        Direção
                      </label>
                      <select
                        id="direcao"
                        name="direcao"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.direcao}
                        onChange={handleChange}
                        required
                      >
                        <option value="COMPRA">COMPRA</option>
                        <option value="VENDA">VENDA</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Dados do Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="strike">
                      Strike
                    </label>
                    <input
                      id="strike"
                      name="strike"
                      type="number"
                      step="0.01"
                      min="0"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Ex: 35.50"
                      value={formData.strike}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="preco">
                      Preço (Abertura)
                    </label>
                    <input
                      id="preco"
                      name="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Ex: 1.25"
                      value={formData.preco}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantidade">
                      Quantidade
                    </label>
                    <input
                      id="quantidade"
                      name="quantidade"
                      type="number"
                      min="1"
                      step="1"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Ex: 10"
                      value={formData.quantidade}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Margem, Observações e Estratégia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="margemUtilizada">
                      Margem Utilizada (opcional)
                    </label>
                    <input
                      id="margemUtilizada"
                      name="margemUtilizada"
                      type="number"
                      step="0.01"
                      min="0"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Ex: 500"
                      value={formData.margemUtilizada}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Cor da Estratégia (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="corEstrategia"
                        name="corEstrategia"
                        type="color"
                        className="w-16 h-10 border rounded cursor-pointer"
                        value={formData.corEstrategia || '#3B82F6'}
                        onChange={handleChange}
                        disabled={!formData.corEstrategia}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.corEstrategia) {
                            setFormData(prev => ({ ...prev, corEstrategia: '' }));
                          } else {
                            setFormData(prev => ({ ...prev, corEstrategia: '#3B82F6' }));
                          }
                        }}
                        className={`px-3 py-2 text-sm rounded ${
                          formData.corEstrategia 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {formData.corEstrategia ? 'Remover Cor' : 'Adicionar Cor'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use para agrupar operações relacionadas (ex: travas, estratégias)
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacoes">
                    Observações (opcional)
                  </label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="2"
                    placeholder="Informações adicionais sobre a operação..."
                    value={formData.observacoes}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              {/* Datas de Abertura e Fechamento */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Datas da Operação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dataAbertura">
                      Data de Abertura
                    </label>
                    <input
                      id="dataAbertura"
                      name="dataAbertura"
                      type="date"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.dataAbertura}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Por padrão é a data de criação da operação
                    </p>
                  </div>
                  
                  {(operacao.status !== 'Aberta' || formData.dataFechamento) && (
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dataFechamento">
                        Data de Fechamento
                      </label>
                      <input
                        id="dataFechamento"
                        name="dataFechamento"
                        type="date"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.dataFechamento}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Por padrão é a data em que a operação foi fechada
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações complementares */}
              {operacao.status !== 'Aberta' && (
                <div className="mb-6 p-4 bg-[var(--surface-secondary)] rounded border border-[var(--surface-border)]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Informações de Fechamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">Status:</p>
                      <p className="text-sm">{operacao.status}</p>
                    </div>
                    {operacao.precoFechamento && (
                      <div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Preço de Fechamento:</p>
                        <p className="text-sm">{formatarMoeda(operacao.precoFechamento)}</p>
                      </div>
                    )}
                    {operacao.resultadoTotal !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Resultado:</p>
                        <p className={`text-sm font-medium ${operacao.resultadoTotal > 0 ? 'text-[var(--success)]' : operacao.resultadoTotal < 0 ? 'text-[var(--error)]' : ''}`}>
                          {formatarMoeda(operacao.resultadoTotal)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <Link 
                  href="/operacoes"
                  className="inline-block align-baseline font-bold text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}