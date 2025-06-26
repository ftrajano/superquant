'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
const OperacoesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesParam = searchParams.get('mes');
  const { theme } = useTheme();
  
  // Lista de meses válidos para normalização
  const mesesValidos = {
    'janeiro': 'janeiro', 'fevereiro': 'fevereiro', 'marco': 'marco', 
    'abril': 'abril', 'maio': 'maio', 'junho': 'junho',
    'julho': 'julho', 'agosto': 'agosto', 'setembro': 'setembro',
    'outubro': 'outubro', 'novembro': 'novembro', 'dezembro': 'dezembro', 
    'todas': 'todas'
  };
  
  // Obter o mês atual
  const getMesAtual = () => {
    const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return meses[new Date().getMonth()];
  };
  
  // Normalizar o mês para garantir que seja um dos valores válidos
  const mesAtivo = mesParam ? 
    (mesesValidos[mesParam.toLowerCase()] || getMesAtual()) : 
    getMesAtual();
  
  const anoAtivo = searchParams.get('ano') || new Date().getFullYear().toString();
  const { data: session, status } = useSession();
  
  const [operacoes, setOperacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tickerPrefix, setTickerPrefix] = useState('BOVA'); // Novo estado para o prefixo do ticker
  const [formData, setFormData] = useState({
    ticker: '',
    tipo: 'CALL',
    direcao: 'COMPRA',
    strike: '',
    preco: '',
    quantidade: '1',
    margemUtilizada: '',
    observacoes: '',
    corEstrategia: ''
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
        
        let queryParams = '';
        
        // Se for "todas", não envia o parâmetro de mês para buscar todas as operações do ano
        if (mesAtivo !== 'todas') {
          queryParams = `mes=${mesAtivo}&`;
        }
        
        queryParams += `ano=${anoAtivo}`;
        
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
  
  // Atualizar o prefixo do ticker
  const handlePrefixChange = (prefix) => {
    setTickerPrefix(prefix);
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
    
    // Calcular quantidade disponível para fechar
    const quantidadeOriginal = operacao.quantidadeOriginal || operacao.quantidade || 1;
    const quantidadeJaFechada = operacao.quantidadeFechada || 0;
    const quantidadeDisponivel = quantidadeOriginal - quantidadeJaFechada;
    
    setQuantidadeFechar(quantidadeDisponivel.toString());
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
  
  const calcularSaldoMesAtual = () => {
    // Filtra apenas operações abertas deste mês e ano (ou todas do ano, se mesAtivo for "todas")
    const operacoesAbertas = operacoes.filter(op => {
      // Verificação básica de status
      if (op.status !== 'Aberta') return false;
      
      // Se for "todas", considerar todas operações do ano
      if (mesAtivo === 'todas') {
        return op.anoReferencia?.toString() === anoAtivo?.toString();
      }
      
      // Caso contrário, filtrar pelo mês e ano específicos
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
          case 'ticker':
            valorPrimarioA = a.ticker || a.nome || '';
            valorPrimarioB = b.ticker || b.nome || '';
            break;
          case 'dataAbertura':
            valorPrimarioA = new Date(a.dataAbertura).getTime();
            valorPrimarioB = new Date(b.dataAbertura).getTime();
            break;
          case 'strike':
            valorPrimarioA = a.strike || 0;
            valorPrimarioB = b.strike || 0;
            break;
          case 'resultado':
            valorPrimarioA = a.resultadoTotal || 0;
            valorPrimarioB = b.resultadoTotal || 0;
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
        case 'ticker':
          valorA = a.ticker || a.nome || '';
          valorB = b.ticker || b.nome || '';
          break;
        case 'dataAbertura':
          valorA = new Date(a.dataAbertura).getTime();
          valorB = new Date(b.dataAbertura).getTime();
          break;
        case 'dataFechamento':
          valorA = a.dataFechamento ? new Date(a.dataFechamento).getTime() : 0;
          valorB = b.dataFechamento ? new Date(b.dataFechamento).getTime() : 0;
          break;
        case 'valorTotal':
          valorA = a.valorTotal || a.preco * (a.quantidade || 1) || 0;
          valorB = b.valorTotal || b.preco * (b.quantidade || 1) || 0;
          break;
        case 'strike':
          valorA = a.strike || 0;
          valorB = b.strike || 0;
          break;
        case 'resultado':
          valorA = a.resultadoTotal || 0;
          valorB = b.resultadoTotal || 0;
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
        
        // Calcular quantidade disponível para fechar
        const quantidadeOriginal = operacaoParaFechar.quantidadeOriginal || operacaoParaFechar.quantidade || 1;
        const quantidadeJaFechada = operacaoParaFechar.quantidadeFechada || 0;
        const quantidadeDisponivel = quantidadeOriginal - quantidadeJaFechada;
        
        if (qtde > quantidadeDisponivel) {
          throw new Error(`Quantidade a fechar não pode ser maior que a quantidade disponível (${quantidadeDisponivel})`);
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
      
      // Se estivermos na visualização "todas", definir um mês padrão para a nova operação
      // pois a API requer um mês de referência ao criar
      const mesDaOperacao = mesAtivo === 'todas' ? 
        // Usar o mês atual como padrão quando estiver na visualização "todas"
        meses[new Date().getMonth()].value : 
        mesAtivo;
      
      const novaOperacao = {
        // Concatenar o prefixo ao ticker apenas se não for "Outros"
        ticker: tickerPrefix !== 'Outros' ? tickerPrefix + formData.ticker.trim() : formData.ticker.trim(),
        mesReferencia: mesDaOperacao,
        anoReferencia: anoAtivo,
        tipo: formData.tipo,
        direcao: formData.direcao,
        strike: parseFloat(formData.strike),
        preco: parseFloat(formData.preco),
        quantidade: parseInt(formData.quantidade) || 1,
        margemUtilizada: formData.margemUtilizada ? parseFloat(formData.margemUtilizada) : 0,
        observacoes: formData.observacoes || '',
        corEstrategia: formData.corEstrategia || null
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
        observacoes: '',
        corEstrategia: ''
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
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
      {/* Modal para fechar operação */}
      {showFecharModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-xl w-full max-w-md">
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
                      max={(() => {
                        const quantidadeOriginal = operacaoParaFechar?.quantidadeOriginal || operacaoParaFechar?.quantidade || 1;
                        const quantidadeJaFechada = operacaoParaFechar?.quantidadeFechada || 0;
                        return quantidadeOriginal - quantidadeJaFechada;
                      })()}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={`Máximo: ${(() => {
                        const quantidadeOriginal = operacaoParaFechar?.quantidadeOriginal || operacaoParaFechar?.quantidade || 1;
                        const quantidadeJaFechada = operacaoParaFechar?.quantidadeFechada || 0;
                        return quantidadeOriginal - quantidadeJaFechada;
                      })()}`}
                      value={quantidadeFechar}
                      onChange={(e) => setQuantidadeFechar(e.target.value)}
                      required={fechamentoParcial}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const quantidadeOriginal = operacaoParaFechar?.quantidadeOriginal || operacaoParaFechar?.quantidade || 1;
                        const quantidadeJaFechada = operacaoParaFechar?.quantidadeFechada || 0;
                        const quantidadeDisponivel = quantidadeOriginal - quantidadeJaFechada;
                        const quantidadeParaFechar = parseInt(quantidadeFechar || 0);
                        
                        if (quantidadeParaFechar < quantidadeDisponivel) {
                          return `Após o fechamento, você ficará com ${quantidadeDisponivel - quantidadeParaFechar} unidades em aberto.`;
                        } else {
                          return 'Você está fechando toda a posição restante.';
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Resumo da operação */}
              {precoFechamento && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-[#1B5E20] dark:bg-opacity-30 rounded-md">
                  <h3 className="font-medium text-blue-800 dark:text-white mb-1">Resumo</h3>
                  <div className="text-sm text-gray-800 dark:text-white">
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
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
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
          <h1 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--primary)]">Minhas Operações</h1>
          <p className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">Gerenciamento de operações pessoais</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/margem"
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold px-4 py-2 rounded"
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)"
            }}
          >
            Controle de Margem
          </Link>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold px-4 py-2 rounded"
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)"
            }}
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
        <div className="flex items-center space-x-4">
          <div className="inline-flex shadow-sm rounded-md">
            <button
              type="button"
              onClick={() => setStatusFiltro('Todos')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                statusFiltro === 'Todos' 
                  ? 'bg-[var(--primary)] text-white' 
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
                  ? 'bg-[var(--primary)] text-white' 
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
                  ? 'bg-[var(--primary)] text-white' 
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
                color: calcularSaldoMesAtual() > 0 
                  ? theme === 'dark' ? '#00cc00' : '#16a34a' 
                  : calcularSaldoMesAtual() < 0 
                    ? '#dc2626' 
                    : '#6b7280'
              }}
            >
              {formatarMoeda(calcularSaldoMesAtual())}
            </div>
          </div>
          
          {/* Valor das operações abertas selecionadas */}
          <div className="flex items-center px-3 py-2 rounded shadow-sm bg-[var(--surface-card)]">
            <div className="mr-2 text-xs text-[var(--text-secondary)]">Valor operações selecionadas:</div>
            <div 
              className="font-semibold text-sm"
              style={{
                color: calcularSaldoCesta() > 0 
                  ? theme === 'dark' ? '#00cc00' : '#16a34a' 
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
          <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-xl w-full max-w-md">
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
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ticker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Resultado</th>
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
        <div className="bg-[var(--surface-card)] p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Nova Operação</h2>
          <form onSubmit={handleSubmit}>
            {/* Seleção de prefixo de ticker */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tipo de Opção
              </label>
              <div className="flex space-x-4 items-center">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixBOVA" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={tickerPrefix === 'BOVA'}
                    onChange={() => handlePrefixChange('BOVA')}
                  />
                  <label htmlFor="prefixBOVA" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                    BOVA
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixSMAL" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={tickerPrefix === 'SMAL'}
                    onChange={() => handlePrefixChange('SMAL')}
                  />
                  <label htmlFor="prefixSMAL" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                    SMAL
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixIBOV" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={tickerPrefix === 'IBOV'}
                    onChange={() => handlePrefixChange('IBOV')}
                  />
                  <label htmlFor="prefixIBOV" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                    IBOV
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixOutros" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={tickerPrefix === 'Outros'}
                    onChange={() => handlePrefixChange('Outros')}
                  />
                  <label htmlFor="prefixOutros" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                    Outros
                  </label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ticker">
                  Ticker {tickerPrefix !== 'Outros' && `(será prefixado com ${tickerPrefix})`}
                </label>
                <input
                  id="ticker"
                  name="ticker"
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder={tickerPrefix !== 'Outros' ? "Ex: A123" : "Ex: PETR4"}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold px-4 py-2 rounded"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)"
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Operação'}
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-[var(--surface-tertiary)] text-[var(--text-primary)] px-4 py-2 rounded hover:bg-[var(--surface-tonal-hover)]"
                style={{
                  fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)"
                }}
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
              <p className="text-[var(--text-secondary)]">
                {mesAtivo === 'todas' 
                  ? `Nenhuma operação encontrada para o ano de ${anoAtivo}.` 
                  : `Nenhuma operação encontrada para ${mesAtivo} de ${anoAtivo}.`}
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 inline-block bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white dark:text-black font-bold px-4 py-2 rounded"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)"
                }}
              >
                Criar Nova Operação
              </button>
            </div>
          ) : (
            <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--surface-border)]">
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                      Sel
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('ticker')}
                    >
                      <div className="flex items-center">
                        Ticker
                        {ordenacao.campo === 'ticker' && (
                          <span className="ml-1 text-[var(--primary)]">
                            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('dataAbertura')}
                    >
                      <div className="flex items-center">
                        Abertura
                        {ordenacao.campo === 'dataAbertura' && (
                          <span className="ml-1 text-[var(--primary)]">
                            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap cursor-pointer"
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Direção</th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap cursor-pointer"
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Preço</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Qtde</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap"
                    >
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Margem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('resultado')}
                    >
                      <div className="flex items-center">
                        Resultado
                        {ordenacao.campo === 'resultado' && (
                          <span className="ml-1 text-[var(--primary)]">
                            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                  {operacoesOrdenadas.map(op => (
                    <tr 
                      key={op._id} 
                      className={`hover:bg-[var(--surface-secondary)] dark:hover:bg-[var(--surface-tertiary)] ${
                        op.status === 'Fechada' 
                          ? op.resultadoTotal > 0 
                            ? 'bg-green-50 dark:!bg-[#062810]' 
                            : op.resultadoTotal < 0 
                              ? 'bg-red-50 dark:!bg-[#280808]' 
                              : '' 
                          : ''
                      } ${op.corEstrategia ? 'border-l-4' : ''}`}
                      style={{
                        ...(op.status === 'Fechada' ? {
                          backgroundColor: theme === 'dark' 
                            ? op.resultadoTotal > 0 
                              ? '#062810' 
                              : op.resultadoTotal < 0 
                                ? '#280808' 
                                : '' 
                            : ''
                        } : {}),
                        ...(op.corEstrategia ? {
                          borderLeftColor: op.corEstrategia,
                          borderLeftWidth: '4px'
                        } : {})
                      }}
                    >
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={cestalSelecionada.includes(op._id)}
                          onChange={() => handleToggleSelecao(op._id)}
                          className="h-4 w-4 text-[var(--primary)] border-[var(--surface-border)] rounded focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {op.corEstrategia && (
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: op.corEstrategia }}
                              title="Operação faz parte de uma estratégia"
                            ></div>
                          )}
                          <div>
                            <Link href={`/operacoes/${op._id}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                              {op.ticker || (op.nome ? op.nome : 'N/A')}
                            </Link>
                            {op.idVisual && (
                              <div className="text-xs text-[var(--text-tertiary)]">
                                {op.idVisual}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="text-[var(--text-secondary)]">
                          <div>{formatarData(op.dataAbertura)}</div>
                          {op.status === 'Fechada' && op.dataFechamento && (
                            <div className="text-xs text-[var(--text-tertiary)]">
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
                          {formatarMoeda(
                            (op.direcao === 'COMPRA' ? -1 : 1) * 
                            (op.valorTotal || op.preco * (op.quantidade || 1))
                          )}
                          {op.status === 'Fechada' && op.precoFechamento && (
                            <div className="text-xs text-gray-500">
                              F: {formatarMoeda(
                                (op.direcao === 'VENDA' ? -1 : 1) * 
                                (op.valorTotalFechamento || op.precoFechamento * (op.quantidade || 1))
                              )}
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
                        <span 
                          className="font-semibold"
                          style={{
                            color: op.resultadoTotal > 0 
                              ? theme === 'dark' ? '#00cc00' : '#16a34a' 
                              : op.resultadoTotal < 0 
                                ? '#dc2626' 
                                : '#6b7280'
                          }}
                        >
                          {formatarMoeda(op.resultadoTotal)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link 
                            href={`/operacoes/editar/${op._id}`} 
                            className="px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                            style={{
                              backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                              color: theme === 'dark' ? '#bfdbfe' : '#1e40af'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Detalhes
                          </Link>
                          
                          {(op.status === 'Aberta' || op.status === 'Parcialmente Fechada') && (
                            <button 
                              onClick={() => handleFecharOperacao(op._id)}
                              className="px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                              style={{
                                backgroundColor: theme === 'dark' ? '#7c2d12' : '#ffedd5',
                                color: theme === 'dark' ? '#fdba74' : '#c2410c'
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Fechar
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDelete(op._id, op.ticker || op.nome || 'esta operação')}
                            className="px-1.5 py-0.5 rounded-sm flex items-center text-xs"
                            style={{
                              backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                              color: theme === 'dark' ? '#fecaca' : '#b91c1c'
                            }}
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