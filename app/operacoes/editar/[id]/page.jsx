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
    observacoes: ''
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
          anoReferencia: data.anoReferencia
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

      const operacaoAtualizada = {
        ticker: formData.ticker.trim(),
        tipo: formData.tipo,
        direcao: formData.direcao,
        strike: parseFloat(formData.strike),
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade),
        margemUtilizada: formData.margemUtilizada ? parseFloat(formData.margemUtilizada) : 0,
        observacoes: formData.observacoes || ''
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Editar Operação</h1>
            <p className="text-gray-600">Atualize os detalhes da operação</p>
          </div>
          <Link 
            href="/operacoes" 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Voltar para Operações
          </Link>
        </div>

        {/* Estado de carregamento */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando dados da operação...</p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulário de edição */}
        {!isLoading && !error && operacao && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              {operacao.status === 'Fechada' && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                  <p className="font-medium">Atenção: esta operação já está fechada.</p>
                  <p className="text-sm">Algumas alterações podem não ser aplicáveis.</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Informações Básicas</h3>
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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Dados do Contrato</h3>
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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Margem e Observações</h3>
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
              </div>

              {/* Informações complementares apenas para visualização */}
              {operacao.status !== 'Aberta' && (
                <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Informações de Fechamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status:</p>
                      <p className="text-sm">{operacao.status}</p>
                    </div>
                    {operacao.dataFechamento && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Data de Fechamento:</p>
                        <p className="text-sm">{new Date(operacao.dataFechamento).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {operacao.precoFechamento && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Preço de Fechamento:</p>
                        <p className="text-sm">{formatarMoeda(operacao.precoFechamento)}</p>
                      </div>
                    )}
                    {operacao.resultadoTotal !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Resultado:</p>
                        <p className={`text-sm font-medium ${operacao.resultadoTotal > 0 ? 'text-green-600' : operacao.resultadoTotal < 0 ? 'text-red-600' : ''}`}>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <Link 
                  href="/operacoes"
                  className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
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