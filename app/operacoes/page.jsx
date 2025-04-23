'use client';

import { useState, useEffect, Suspense } from 'react';
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
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);

// Componente principal que usa useSearchParams
const OperacoesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesParam = searchParams.get('mes');
  
  // Lista de meses válidos para normalização
  const mesesValidos = {
    'janeiro': 'janeiro', 'fevereiro': 'fevereiro', 'marco': 'marco', 
    'abril': 'abril', 'maio': 'maio', 'junho': 'junho',
    'julho': 'julho', 'agosto': 'agosto', 'setembro': 'setembro',
    'outubro': 'outubro', 'novembro': 'novembro', 'dezembro': 'dezembro'
  };
  
  // Normalizar o mês para garantir que seja um dos valores válidos
  const mesAtivo = mesParam ? 
    (mesesValidos[mesParam.toLowerCase()] || 'abril') : 
    'abril';
  
  const anoAtivo = searchParams.get('ano') || new Date().getFullYear().toString();
  const { data: session, status } = useSession();
  
  const [operacoes, setOperacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
  
  // Estados para o modal de fechar operação
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [operacaoParaFechar, setOperacaoParaFechar] = useState(null);
  const [precoFechamento, setPrecoFechamento] = useState('');
  const [quantidadeFechar, setQuantidadeFechar] = useState('');
  const [fechamentoParcial, setFechamentoParcial] = useState(false);
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

  // Carregar operações ao mudar o mês, ano ou o filtro de status
  useEffect(() => {
    const fetchOperacoes = async () => {
      if (status !== 'authenticated') {
        console.log('Usuário não autenticado, não buscando operações');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Buscando operações para Mês: ${mesAtivo}, Ano: ${anoAtivo}, Filtro: ${statusFiltro}`);
        console.log('Dados da sessão:', session);
        
        let queryParams = `mes=${mesAtivo}&ano=${anoAtivo}`;
        if (statusFiltro !== 'Todos') {
          queryParams += `&status=${statusFiltro}`;
        }
        
        console.log(`Fazendo requisição para: /api/operacoes?${queryParams}`);
        
        const response = await fetch(`/api/operacoes?${queryParams}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Resposta não-OK:', response.status, errorText);
          throw new Error(`Falha ao buscar operações: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Operações recebidas:`, data);
        console.log(`Total de operações: ${data.operacoes?.length}`);
        setOperacoes(data.operacoes || []);
      } catch (err) {
        console.error('Erro ao buscar operações:', err);
        setError('Não foi possível carregar as operações. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOperacoes();
  }, [mesAtivo, anoAtivo, statusFiltro, status, session]);
  
  // Alternar entre meses
  const handleTabChange = (mes) => {
    router.push(`/operacoes?mes=${mes}&ano=${anoAtivo}`);
  };
  
  // Alternar entre anos
  const handleYearChange = (ano) => {
    router.push(`/operacoes?mes=${mesAtivo}&ano=${ano}`);
  };
  
  // Excluir operação
  const handleDelete = async (id, nome) => {
    console.log(`Tentando excluir operação: ID=${id}, Nome=${nome}`);
    if (confirm(`Tem certeza que deseja excluir a operação "${nome}"?`)) {
      try {
        console.log(`Enviando requisição DELETE para /api/operacoes/${id}`);
        const response = await fetch(`/api/operacoes/${id}`, {
          method: 'DELETE',
        });
        
        console.log('Resposta recebida:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao excluir:', errorData);
          throw new Error(`Falha ao excluir operação: ${errorData.error || response.status}`);
        }
        
        // Remover a operação da lista local
        setOperacoes(operacoes.filter(op => op._id !== id));
        console.log('Operação excluída com sucesso!');
      } catch (err) {
        console.error('Erro ao excluir operação:', err);
        alert('Não foi possível excluir a operação. Por favor, tente novamente.');
      }
    }
  };
  
  // Função para abrir o modal de fechar operação
  const handleFecharOperacao = (id) => {
    const operacao = operacoes.find(op => op._id === id);
    setOperacaoParaFechar(operacao);
    setPrecoFechamento('');
    setQuantidadeFechar(operacao.quantidade || '1');
    setFechamentoParcial(false);
    setShowFecharModal(true);
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

  // Função para enviar o formulário de fechamento
  const handleSubmitFechar = async (e) => {
    e.preventDefault();
    setIsSubmittingFechar(true);
    
    try {
      if (!precoFechamento || isNaN(parseFloat(precoFechamento))) {
        throw new Error('Preço de fechamento é obrigatório e deve ser um número válido');
      }
      
      // Validar quantidade para fechamento parcial
      if (fechamentoParcial) {
        const qtde = parseInt(quantidadeFechar);
        if (isNaN(qtde) || qtde <= 0) {
          throw new Error('Quantidade a fechar é obrigatória e deve ser um número positivo');
        }
        
        if (qtde > (operacaoParaFechar.quantidade || 1)) {
          throw new Error(`Quantidade a fechar não pode ser maior que a quantidade total (${operacaoParaFechar.quantidade || 1})`);
        }
      }
      
      // Preparar os dados para enviar
      const dadosFechamento = { 
        precoFechamento: parseFloat(precoFechamento) 
      };
      
      // Adicionar quantidade somente para fechamento parcial
      if (fechamentoParcial) {
        dadosFechamento.quantidadeFechar = parseInt(quantidadeFechar);
      }
      
      const response = await fetch(`/api/operacoes/${operacaoParaFechar._id}/fechar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosFechamento),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao fechar operação');
      }
      
      // Atualizar a lista de operações, dependendo se é fechamento total ou parcial
      if (responseData.operacaoFechada && responseData.operacaoOriginal) {
        // Fechamento parcial: atualizar a operação original e adicionar a nova operação fechada
        setOperacoes(operacoes.map(op => 
          op._id === operacaoParaFechar._id ? responseData.operacaoOriginal : op
        ).concat(responseData.operacaoFechada));
      } else if (responseData.operacaoFechada) {
        // Fechamento total: substituir a operação na lista
        setOperacoes(operacoes.map(op => 
          op._id === operacaoParaFechar._id ? responseData.operacaoFechada : op
        ));
      }
      
      // Exibir uma mensagem de sucesso
      alert(responseData.mensagem || 'Operação fechada com sucesso');
      
      // Limpar o modal
      setShowFecharModal(false);
      setOperacaoParaFechar(null);
      setPrecoFechamento('');
      setQuantidadeFechar('');
      setFechamentoParcial(false);
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao fechar a operação. Por favor, tente novamente.');
    } finally {
      setIsSubmittingFechar(false);
    }
  };
  
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
      
      const novaOperacao = {
        ticker: formData.ticker.trim(),
        mesReferencia: mesAtivo,
        anoReferencia: anoAtivo,
        tipo: formData.tipo,
        direcao: formData.direcao,
        strike: parseFloat(formData.strike),
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade) || 1,
        margemUtilizada: formData.margemUtilizada ? parseFloat(formData.margemUtilizada) : 0,
        observacoes: formData.observacoes || ''
      };
      
      console.log('Enviando operação:', novaOperacao);
      
      const response = await fetch('/api/operacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novaOperacao),
      });
      
      // Obter detalhes da resposta, seja sucesso ou erro
      const responseData = await response.json();
      console.log('Resposta da API:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao criar operação');
      }
      
      // Adicionar a nova operação à lista e resetar o formulário
      setOperacoes([responseData, ...operacoes]);
      setFormData({
        ticker: '',
        tipo: 'CALL',
        direcao: 'COMPRA',
        strike: '',
        preco: '',
        quantidade: '1',
        margemUtilizada: '',
        observacoes: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao criar a operação. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Modal para fechar operação */}
      {showFecharModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Fechar Operação</h2>
            <div className="mb-4">
              <p className="font-medium">{operacaoParaFechar?.ticker}</p>
              <p className="text-sm text-gray-500">
                {operacaoParaFechar?.tipo} {operacaoParaFechar?.direcao} | Quantidade: {operacaoParaFechar?.quantidade || 1} | 
                Preço: {formatarMoeda(operacaoParaFechar?.preco)}
              </p>
            </div>
            
            <form onSubmit={handleSubmitFechar}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="precoFechamento">
                  Preço de Fechamento
                </label>
                <input
                  id="precoFechamento"
                  name="precoFechamento"
                  type="number"
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ex: 1.50"
                  value={precoFechamento}
                  onChange={(e) => setPrecoFechamento(e.target.value)}
                  required
                />
              </div>
              
              {/* Opção de fechamento parcial */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    id="fechamentoParcial"
                    name="fechamentoParcial"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={fechamentoParcial}
                    onChange={(e) => setFechamentoParcial(e.target.checked)}
                  />
                  <label className="ml-2 block text-gray-700 text-sm font-medium" htmlFor="fechamentoParcial">
                    Fechar apenas parte da posição
                  </label>
                </div>
                
                {fechamentoParcial && (
                  <div className="pl-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantidadeFechar">
                      Quantidade a Fechar
                    </label>
                    <input
                      id="quantidadeFechar"
                      name="quantidadeFechar"
                      type="number"
                      min="1"
                      max={operacaoParaFechar?.quantidade || 1}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={`Máximo: ${operacaoParaFechar?.quantidade || 1}`}
                      value={quantidadeFechar}
                      onChange={(e) => setQuantidadeFechar(e.target.value)}
                      required={fechamentoParcial}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {parseInt(quantidadeFechar) < (operacaoParaFechar?.quantidade || 1) 
                        ? `Após o fechamento, você ficará com ${(operacaoParaFechar?.quantidade || 1) - parseInt(quantidadeFechar || 0)} unidades em aberto.`
                        : 'Você está fechando toda a posição.'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Resumo da operação */}
              {precoFechamento && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-1">Resumo</h3>
                  <div className="text-sm">
                    <p>Preço de abertura: {formatarMoeda(operacaoParaFechar?.preco)}</p>
                    <p>Preço de fechamento: {formatarMoeda(parseFloat(precoFechamento))}</p>
                    <p>Quantidade: {fechamentoParcial ? quantidadeFechar : (operacaoParaFechar?.quantidade || 1)}</p>
                    {precoFechamento && operacaoParaFechar?.preco && (
                      <p className="font-medium mt-1">
                        Resultado estimado: {' '}
                        <span className={
                          ((operacaoParaFechar?.direcao === 'COMPRA' 
                            ? parseFloat(precoFechamento) - operacaoParaFechar?.preco 
                            : operacaoParaFechar?.preco - parseFloat(precoFechamento)) > 0)
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          {formatarMoeda(
                            (operacaoParaFechar?.direcao === 'COMPRA' 
                              ? parseFloat(precoFechamento) - operacaoParaFechar?.preco 
                              : operacaoParaFechar?.preco - parseFloat(precoFechamento)) * 
                            (fechamentoParcial ? parseInt(quantidadeFechar || 1) : (operacaoParaFechar?.quantidade || 1))
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowFecharModal(false);
                    setOperacaoParaFechar(null);
                    setPrecoFechamento('');
                    setQuantidadeFechar('');
                    setFechamentoParcial(false);
                  }}
                  className="text-gray-600 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSubmittingFechar}
                >
                  {isSubmittingFechar ? 'Processando...' : (fechamentoParcial ? 'Fechar Parcialmente' : 'Fechar Operação')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">Minhas Operações</h1>
          <p className="text-gray-600">Gerenciamento de operações pessoais</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/margem"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Controle de Margem
          </Link>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : '+ Nova Operação'}
          </button>
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
      
      {/* Formulário de nova operação */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Nova Operação</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  Preço
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
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="margemUtilizada">
                  Margem Utilizada
                </label>
                <input
                  id="margemUtilizada"
                  name="margemUtilizada"
                  type="number"
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ex: 500.00 (opcional)"
                  value={formData.margemUtilizada}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-4">
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
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Operação'}
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
              >
                Cancelar
              </button>
            </div>
          </form>
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
              <p className="text-gray-500">Nenhuma operação encontrada para {mesAtivo}.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Criar Nova Operação
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Sel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ticker</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Abertura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Direção</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Strike</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Preço</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Qtde</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Valor Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Margem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Resultado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
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
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={cestalSelecionada.includes(op._id)}
                          onChange={() => handleToggleSelecao(op._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/operacoes/${op._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {op.ticker || (op.nome ? op.nome : 'N/A')}
                        </Link>
                        {op.idVisual && (
                          <div className="text-xs text-gray-500">
                            {op.idVisual}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="text-gray-600">
                          <div>{formatarData(op.dataAbertura)}</div>
                          {op.status === 'Fechada' && op.dataFechamento && (
                            <div className="text-xs">
                              F: {formatarData(op.dataFechamento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                          op.tipo === 'CALL' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                          op.direcao === 'COMPRA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {op.direcao}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatarMoeda(op.strike)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          {formatarMoeda(op.preco)}
                          {op.status === 'Fechada' && op.precoFechamento && (
                            <div className="text-xs text-gray-500">
                              F: {formatarMoeda(op.precoFechamento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        {op.quantidade || 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          {formatarMoeda(op.valorTotal || op.preco * (op.quantidade || 1))}
                          {op.status === 'Fechada' && op.precoFechamento && (
                            <div className="text-xs text-gray-500">
                              F: {formatarMoeda(op.valorTotalFechamento || op.precoFechamento * (op.quantidade || 1))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {op.margemUtilizada ? formatarMoeda(op.margemUtilizada) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={op.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link 
                            href={`/operacoes/editar/${op._id}`} 
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Detalhes
                          </Link>
                          
                          {(op.status === 'Aberta' || op.status === 'Parcialmente Fechada') && (
                            <button 
                              onClick={() => handleFecharOperacao(op._id)}
                              className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Fechar
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDelete(op._id, op.ticker || op.nome || 'esta operação')}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
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
};

// Componente wrapper com Suspense
export default function OperacoesPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <OperacoesContent />
    </Suspense>
  );
}