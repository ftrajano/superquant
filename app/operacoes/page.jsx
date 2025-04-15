'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TabSelector from '@/components/ui/TabSelector.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OperacoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesAtivo = searchParams.get('mes') || 'abril';
  
  const [operacoes, setOperacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    mesReferencia: mesAtivo,
    tipo: 'CALL',
    direcao: 'COMPRA',
    strike: '',
    preco: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para o modal de fechar operação
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [operacaoParaFechar, setOperacaoParaFechar] = useState(null);
  const [precoFechamento, setPrecoFechamento] = useState('');
  const [isSubmittingFechar, setIsSubmittingFechar] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  
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
  
  // Carregar operações ao mudar o mês ou o filtro de status
  useEffect(() => {
    const fetchOperacoes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let queryParams = `mes=${mesAtivo}`;
        if (statusFiltro !== 'Todos') {
          queryParams += `&status=${statusFiltro}`;
        }
        
        const response = await fetch(`/api/operacoes?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar operações');
        }
        
        const data = await response.json();
        setOperacoes(data);
      } catch (err) {
        console.error('Erro:', err);
        setError('Não foi possível carregar as operações. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Atualizar o mês de referência no formulário quando o mês ativo mudar
    setFormData(prev => ({
      ...prev,
      mesReferencia: mesAtivo
    }));
    
    fetchOperacoes();
  }, [mesAtivo, statusFiltro]);
  
  // Alternar entre meses
  const handleTabChange = (mes) => {
    router.push(`/operacoes?mes=${mes}`);
  };
  
  // Excluir operação
  const handleDelete = async (id, nome) => {
    if (confirm(`Tem certeza que deseja excluir a operação "${nome}"?`)) {
      try {
        const response = await fetch(`/api/operacoes/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Falha ao excluir operação');
        }
        
        // Remover a operação da lista local
        setOperacoes(operacoes.filter(op => op._id !== id));
      } catch (err) {
        console.error('Erro:', err);
        alert('Não foi possível excluir a operação. Por favor, tente novamente.');
      }
    }
  };
  
  // Função para abrir o modal de fechar operação
  const handleFecharOperacao = (id) => {
    const operacao = operacoes.find(op => op._id === id);
    setOperacaoParaFechar(operacao);
    setShowFecharModal(true);
  };
  
  // Função para enviar o formulário de fechamento
  const handleSubmitFechar = async (e) => {
    e.preventDefault();
    setIsSubmittingFechar(true);
    
    try {
      if (!precoFechamento || isNaN(parseFloat(precoFechamento))) {
        throw new Error('Preço de fechamento é obrigatório e deve ser um número válido');
      }
      
      const response = await fetch(`/api/operacoes/${operacaoParaFechar._id}/fechar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ precoFechamento: parseFloat(precoFechamento) }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao fechar operação');
      }
      
      // Atualizar a operação na lista local
      setOperacoes(operacoes.map(op => 
        op._id === operacaoParaFechar._id ? responseData : op
      ));
      
      // Limpar o modal
      setShowFecharModal(false);
      setOperacaoParaFechar(null);
      setPrecoFechamento('');
      
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
      if (!formData.nome.trim()) {
        throw new Error('Nome da operação é obrigatório');
      }
      
      if (!formData.strike || isNaN(parseFloat(formData.strike))) {
        throw new Error('Strike é obrigatório e deve ser um número válido');
      }
      
      if (!formData.preco || isNaN(parseFloat(formData.preco))) {
        throw new Error('Preço é obrigatório e deve ser um número válido');
      }
      
      const novaOperacao = {
        nome: formData.nome.trim(),
        mesReferencia: mesAtivo,
        tipo: formData.tipo,
        direcao: formData.direcao,
        strike: parseFloat(formData.strike),
        preco: parseFloat(formData.preco),
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
        nome: '',
        mesReferencia: mesAtivo,
        tipo: 'CALL',
        direcao: 'COMPRA',
        strike: '',
        preco: '',
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
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Modal para fechar operação */}
      {showFecharModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Fechar Operação</h2>
            <p className="mb-4">Informe o preço de fechamento para "{operacaoParaFechar?.nome}"</p>
            
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
              
              <div className="flex items-center justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowFecharModal(false);
                    setOperacaoParaFechar(null);
                    setPrecoFechamento('');
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
                  {isSubmittingFechar ? 'Processando...' : 'Fechar Operação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Superquant</h1>
          <p className="text-gray-600 text-lg">Módulo Opções</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Nova Operação'}
        </button>
      </div>
      
      {/* Selector de Meses */}
      <TabSelector 
        tabs={meses} 
        activeTab={mesAtivo} 
        onTabChange={handleTabChange} 
      />
      
      {/* Filtro de Status */}
      <div className="mb-4 flex justify-end">
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
      </div>
      
      {/* Formulário de nova operação */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Nova Operação</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nome">
                  Nome da Operação
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ex: Trava de Alta PETR4"
                  value={formData.nome}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direção</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/operacoes/${op._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {op.nome}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">Aberta: {formatarData(op.dataAbertura)}</p>
                        {op.status === 'Fechada' && op.dataFechamento && (
                          <p className="text-xs text-gray-500 mt-1">
                            Fechada: {formatarData(op.dataFechamento)}
                          </p>
                        )}
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
                        <div className="flex space-x-2">
                          <Link href={`/operacoes/${op._id}`} className="text-blue-600 hover:text-blue-800">
                            Detalhes
                          </Link>
                          {op.status === 'Aberta' && (
                            <button 
                              onClick={() => handleFecharOperacao(op._id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              Fechar
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(op._id, op.nome)}
                            className="text-red-600 hover:text-red-800"
                          >
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
  );
}