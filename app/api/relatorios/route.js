// app/api/relatorios/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função auxiliar para calcular o intervalo de datas para o período
const calcularIntervaloDatas = (periodo) => {
  const hoje = new Date();
  let dataInicio = new Date();
  
  switch (periodo) {
    case 'ultimoMes':
      dataInicio.setMonth(hoje.getMonth() - 1);
      break;
    case 'ultimos3meses':
      dataInicio.setMonth(hoje.getMonth() - 3);
      break;
    case 'ultimos6meses':
      dataInicio.setMonth(hoje.getMonth() - 6);
      break;
    case 'todos':
    default:
      dataInicio = new Date(0); // Data mais antiga possível
      break;
  }
  
  return { dataInicio, dataFim: hoje };
};

// Função para formatar nome do mês
const formatarMes = (data) => {
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const ano = data.getFullYear();
  const mes = data.getMonth();
  return `${meses[mes]}/${ano.toString().slice(2)}`;
};

// As funções de agrupamento por mês foram removidas

// GET - Buscar dados para relatórios
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'ultimos3meses';
    
    // Lista de meses válidos para referência
    const mesesValidos = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                         'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    // Obter a sessão de autenticação para recuperar o ID do usuário
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log('Sessão obtida:', session);
    } catch (sessionError) {
      console.error('Erro ao obter sessão:', sessionError);
      return NextResponse.json(
        { error: 'Falha ao verificar autenticação', details: sessionError.message },
        { status: 500 }
      );
    }
    
    // Verificar se o usuário está autenticado
    if (!session?.user) {
      console.error('Sessão sem dados de usuário:', session);
      return NextResponse.json(
        { error: 'Não autenticado - sessão inválida' },
        { status: 401 }
      );
    }
    
    // Verificar se o ID do usuário está presente
    if (!session.user.id) {
      console.error('Sessão sem ID de usuário:', session.user);
      return NextResponse.json(
        { error: 'Não autenticado - ID de usuário não encontrado' },
        { status: 401 }
      );
    }
    
    // Obter o ID do usuário atual para filtrar as operações
    const userId = session.user.id;
    
    await connectToDatabase();
    
    // Definir variáveis para uso posterior (dataInicio e dataFim)
    let dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 3); // Default: últimos 3 meses
    let dataFim = new Date();
    
    // Calcular intervalo de datas baseado no período
    let filtroConsulta = {};
    
    if (periodo === 'mesEspecifico' || periodo === 'mesEspecifico_update') {
      // Obter mês e ano dos parâmetros
      const mes = searchParams.get('mes');
      const ano = searchParams.get('ano');
      
      console.log(`Parâmetros recebidos: mes=${mes}, ano=${ano}, periodo=${periodo}`);
      
      if (mes && ano) {
        // Filtrar pelo mês e ano separadamente (novo formato)
        console.log(`Filtrando operações por mês específico: ${mes} ${ano}`);
        filtroConsulta.mesReferencia = mes;
        filtroConsulta.anoReferencia = parseInt(ano);
      } else {
        // Se não tiver mês e ano, usar o intervalo de datas padrão
        const intervaloDatas = calcularIntervaloDatas('ultimos3meses');
        dataInicio = intervaloDatas.dataInicio;
        dataFim = intervaloDatas.dataFim;
        filtroConsulta.dataAbertura = { $gte: dataInicio, $lte: dataFim };
      }
    } else {
      // Para outros períodos, usar o intervalo de datas padrão
      const intervaloDatas = calcularIntervaloDatas(periodo);
      dataInicio = intervaloDatas.dataInicio;
      dataFim = intervaloDatas.dataFim;
      filtroConsulta.dataAbertura = { $gte: dataInicio, $lte: dataFim };
    }
    
    // Buscar operações fechadas no período
    let queryOperacoesFechadas = { 
      userId: userId, // Apenas operações do usuário atual
      $or: [
        // Status "Fechada" - Operações completamente fechadas
        { status: 'Fechada' },
        // Operações que são resultado de fechamento parcial
        { operacaoOriginalId: { $ne: null } }
      ]
    };
    
    // Adicionar filtro de data ou mês-ano conforme o caso
    if (filtroConsulta.mesReferencia && filtroConsulta.anoReferencia) {
      // Novo formato: mês e ano separados
      // Para operações fechadas em mês específico, precisamos considerar várias possibilidades:
      
      // Criar intervalo de datas para o mês específico
      const mesIndex = mesesValidos.indexOf(filtroConsulta.mesReferencia);
      const ano = filtroConsulta.anoReferencia;
      
      // Primeiro dia do mês
      const inicioMes = new Date(ano, mesIndex, 1);
      // Último dia do mês (primeiro dia do próximo mês - 1 dia)
      const fimMes = new Date(ano, mesIndex + 1, 0, 23, 59, 59, 999);
      
      // Condições para o filtro de mês/ano específico
      const condicoesMesAno = [
        // Caso 1: Operações referentes ao mês/ano específico com status "Fechada"
        {
          mesReferencia: filtroConsulta.mesReferencia,
          anoReferencia: filtroConsulta.anoReferencia,
          status: 'Fechada'
        },
        // Caso 2: Operações fechadas dentro deste mês/ano, independente da referência
        {
          dataFechamento: { $gte: inicioMes, $lte: fimMes }
        },
        // Caso 3: Operações resultantes de fechamento parcial, do mês/ano específico
        {
          mesReferencia: filtroConsulta.mesReferencia,
          anoReferencia: filtroConsulta.anoReferencia,
          operacaoOriginalId: { $ne: null }
        }
      ];
      
      // Para mês específico: apenas operações fechadas DENTRO do mês completo
      queryOperacoesFechadas.$or = [
        // Operações referentes ao mês/ano específico com status "Fechada"
        {
          userId: userId,
          mesReferencia: filtroConsulta.mesReferencia,
          anoReferencia: filtroConsulta.anoReferencia,
          status: 'Fechada'
        },
        // Operações fechadas DENTRO do mês completo (dia 1 ao último dia)
        {
          userId: userId,
          dataFechamento: { $gte: inicioMes, $lte: fimMes },
          status: 'Fechada'
        },
        // Operações resultantes de fechamento parcial, do mês/ano específico
        {
          userId: userId,
          mesReferencia: filtroConsulta.mesReferencia,
          anoReferencia: filtroConsulta.anoReferencia,
          operacaoOriginalId: { $ne: null }
        },
        // Operações de fechamento parcial fechadas DENTRO do mês completo
        {
          userId: userId,
          dataFechamento: { $gte: inicioMes, $lte: fimMes },
          operacaoOriginalId: { $ne: null }
        }
      ];
    } else if (filtroConsulta.dataAbertura) {
      // Para filtros baseados em data, vamos considerar:
      // 1. Operações abertas E fechadas no período 
      // 2. Operações fechadas no período, mesmo que abertas antes
      // 3. Operações de fechamento parcial abertas no período
      
      const condicoesData = [
        // Caso 1: Operações que foram abertas no período e fechadas em qualquer momento
        { 
          dataAbertura: { $gte: dataInicio, $lte: dataFim },
          dataFechamento: { $ne: null },
          status: 'Fechada'
        },
        // Caso 2: Operações que foram fechadas dentro do período, não importa quando abertas
        { 
          dataFechamento: { $gte: dataInicio, $lte: dataFim } 
        },
        // Caso 3: Operações de fechamento parcial abertas no período
        {
          dataAbertura: { $gte: dataInicio, $lte: dataFim },
          operacaoOriginalId: { $ne: null }
        }
      ];
      
      // Adicionar condições de período diretamente
      queryOperacoesFechadas.$or = [
        // Operações fechadas que foram fechadas dentro do período
        { 
          userId: userId,
          dataFechamento: { $gte: dataInicio, $lte: dataFim },
          status: 'Fechada'
        },
        // Operações de fechamento parcial fechadas no período
        {
          userId: userId,
          dataFechamento: { $gte: dataInicio, $lte: dataFim },
          operacaoOriginalId: { $ne: null }
        }
      ];
    }
    
    
    let operacoesFechadasPeriodo = [];
    try {
      operacoesFechadasPeriodo = await Operacao.find(queryOperacoesFechadas)
        .sort({ dataFechamento: -1 })
        .lean(); // Usar lean() para melhor performance, retornando objetos JS simples
      
    } catch (dbError) {
      console.error('Erro ao buscar operações fechadas:', dbError);
      // Continuar com um array vazio em vez de falhar completamente
      console.log('Continuando com array vazio para operações fechadas');
    }
    
    // Buscar todas as operações no período (abertas e fechadas)
    let queryTodasOperacoes = {
      userId: userId // Apenas operações do usuário atual
    };
    
    // Para mês específico, usamos os mesmos critérios de mesReferencia e anoReferencia
    if (filtroConsulta.mesReferencia && filtroConsulta.anoReferencia) {
      queryTodasOperacoes.mesReferencia = filtroConsulta.mesReferencia;
      queryTodasOperacoes.anoReferencia = filtroConsulta.anoReferencia;
    } else if (filtroConsulta.dataAbertura) {
      queryTodasOperacoes.dataAbertura = filtroConsulta.dataAbertura;
    }
    
    
    let todasOperacoes = [];
    try {
      todasOperacoes = await Operacao.find(queryTodasOperacoes)
        .sort({ dataAbertura: -1 })
        .lean(); // Usar lean() para melhor performance
      
    } catch (dbError) {
      console.error('Erro ao buscar todas as operações:', dbError);
      // Continuar com um array vazio em vez de falhar completamente
      console.log('Continuando com array vazio para todas as operações');
    }
    
    // Filtragem de operações para evitar dupla contagem em operações de fechamento parcial
    // Para métricas, apenas considerar operações completamente fechadas ou
    // operações resultantes de fechamentos parciais, nunca as duas ao mesmo tempo
    const operacoesParaMetricas = operacoesFechadasPeriodo.filter(op => {
      // Incluir operações de fechamento parcial (têm operacaoOriginalId)
      if (op.operacaoOriginalId) {
        return true;
      }
      
      // Incluir operações fechadas normalmente (sem partes)
      if (op.status === 'Fechada' && (!op.operacoesRelacionadas || op.operacoesRelacionadas.length === 0)) {
        return true;
      }
      
      // Não incluir operações parcialmente fechadas, pois seus resultados
      // já são contabilizados através das operações derivadas
      return false;
    });
    
    
    // === MÉTRICAS GERAIS ===
    // Garantir que as operações existem e são arrays antes de usar métodos de array
    const totalOperacoes = Array.isArray(todasOperacoes) ? todasOperacoes.length : 0;
    
    // Verificar e garantir que operacoesParaMetricas é um array válido
    const operacoesParaMetricasValidas = Array.isArray(operacoesParaMetricas) ? operacoesParaMetricas : [];
    
    // Calcular resultado total com proteção contra valores inválidos
    const resultadoTotal = operacoesParaMetricasValidas.reduce((sum, op) => {
      // Garantir que resultadoTotal é um número válido ou usar 0
      const valor = op && typeof op.resultadoTotal === 'number' ? op.resultadoTotal : 0;
      return sum + valor;
    }, 0);
    
    
    // Contar operações lucrativas com proteção contra valores inválidos
    const operacoesLucrativas = operacoesParaMetricasValidas.filter(op => 
      op && typeof op.resultadoTotal === 'number' && op.resultadoTotal > 0
    ).length;
    
    // Calcular taxa de acerto com proteção contra divisão por zero
    const taxaAcerto = operacoesParaMetricasValidas.length > 0 
      ? Math.round((operacoesLucrativas / operacoesParaMetricasValidas.length) * 100)
      : 0;
    
    // Calcular média com proteção contra divisão por zero
    const mediaResultado = operacoesParaMetricasValidas.length > 0
      ? resultadoTotal / operacoesParaMetricasValidas.length
      : 0;
      
    // Calcular tendência (comparação com período anterior)
    let queryPeriodoAnterior = { 
      userId: userId,
      $or: [
        // Operações fechadas
        { status: 'Fechada' },
        // Operações resultantes de fechamento parcial
        { operacaoOriginalId: { $ne: null } }
      ]
    };
    
    if (filtroConsulta.mesReferencia && filtroConsulta.anoReferencia) {
      // Para mês específico, comparar com o mês anterior
      let anoAnterior = filtroConsulta.anoReferencia;
      let mesAnterior = mesesValidos.indexOf(filtroConsulta.mesReferencia) - 1;
      
      if (mesAnterior < 0) {
        mesAnterior = 11; // Dezembro
        anoAnterior--;
      }
      
      const mesAnteriorStr = mesesValidos[mesAnterior];
      
      // Adicionar condições de filtro por mês e ano anterior
      queryPeriodoAnterior.$or.push(
        { 
          mesReferencia: mesAnteriorStr, 
          anoReferencia: anoAnterior,
          status: 'Fechada'
        },
        {
          mesReferencia: mesAnteriorStr, 
          anoReferencia: anoAnterior,
          operacaoOriginalId: { $ne: null }
        }
      );
    } else {
      // Para períodos baseados em data, comparar com o período anterior equivalente
      const periodoAnteriorInicio = new Date(dataInicio);
      const duracao = dataFim.getTime() - dataInicio.getTime();
      periodoAnteriorInicio.setTime(periodoAnteriorInicio.getTime() - duracao);
      
      const periodoAnteriorFim = new Date(dataInicio);
      periodoAnteriorFim.setTime(periodoAnteriorFim.getTime() - 1); // Um milissegundo antes do início do período atual
      
      // Adicionar condições de filtro por data de fechamento
      queryPeriodoAnterior.$or.push(
        { dataFechamento: { $gte: periodoAnteriorInicio, $lt: dataInicio } }
      );
    }
    
    
    let operacoesPeriodoAnterior = [];
    try {
      operacoesPeriodoAnterior = await Operacao.find(queryPeriodoAnterior).lean();
    } catch (dbError) {
      console.error('Erro ao buscar operações do período anterior:', dbError);
      // Continuar com um array vazio em vez de falhar completamente
      console.log('Continuando com array vazio para operações do período anterior');
    }
    
    // Aplicar a mesma lógica de filtragem que usamos para o período atual
    const operacoesAnterioresParaMetricas = operacoesPeriodoAnterior.filter(op => {
      if (!op) return false; // Proteção contra valores nulos
      
      if (op.operacaoOriginalId) {
        return true;
      }
      if (op.status === 'Fechada' && (!op.operacoesRelacionadas || op.operacoesRelacionadas.length === 0)) {
        return true;
      }
      return false;
    });
    
    const resultadoAnterior = operacoesAnterioresParaMetricas.reduce((sum, op) => sum + (op.resultadoTotal || 0), 0);
    const resultadoTendencia = resultadoAnterior !== 0
      ? Math.round(((resultadoTotal - resultadoAnterior) / Math.abs(resultadoAnterior)) * 100)
      : 0;
    
    // === DISTRIBUIÇÃO ===
    // Por tipo (CALL/PUT)
    const operacoesPorTipo = todasOperacoes.reduce((acc, op) => {
      const tipo = op.tipo || 'N/A';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    
    const distribuicaoTipo = Object.keys(operacoesPorTipo).map(tipo => ({
      nome: tipo,
      valor: operacoesPorTipo[tipo]
    }));
    
    // Por direção (COMPRA/VENDA)
    const operacoesPorDirecao = todasOperacoes.reduce((acc, op) => {
      const direcao = op.direcao || 'N/A';
      acc[direcao] = (acc[direcao] || 0) + 1;
      return acc;
    }, {});
    
    const distribuicaoDirecao = Object.keys(operacoesPorDirecao).map(direcao => ({
      nome: direcao,
      valor: operacoesPorDirecao[direcao]
    }));
    
    
    // === DADOS PARA OS GRÁFICOS ===

    // Calcular lucro acumulado ordenando operações por data de fechamento
    // Filtrar apenas operações dentro do período selecionado
    let operacoesOrdenadas = [...operacoesParaMetricas]
      .filter(op => op.dataFechamento);
    
    // Aplicar filtro de período para o gráfico
    if (filtroConsulta.mesReferencia && filtroConsulta.anoReferencia) {
      // Para mês específico, filtrar por período do mês
      const mesIndex = mesesValidos.indexOf(filtroConsulta.mesReferencia);
      const ano = filtroConsulta.anoReferencia;
      const inicioMes = new Date(ano, mesIndex, 1);
      const fimMes = new Date(ano, mesIndex + 1, 0, 23, 59, 59, 999);
      
      operacoesOrdenadas = operacoesOrdenadas.filter(op => {
        const dataFech = new Date(op.dataFechamento);
        return dataFech >= inicioMes && dataFech <= fimMes;
      });
    } else if (filtroConsulta.dataAbertura) {
      // Para períodos por data, filtrar pelo período
      operacoesOrdenadas = operacoesOrdenadas.filter(op => {
        const dataFech = new Date(op.dataFechamento);
        return dataFech >= dataInicio && dataFech <= dataFim;
      });
    }
    
    operacoesOrdenadas = operacoesOrdenadas.sort((a, b) => new Date(a.dataFechamento) - new Date(b.dataFechamento));

    let saldoAcumulado = 0;
    const lucroAcumulado = operacoesOrdenadas.map(op => {
      // Incrementar o saldo acumulado com o resultado da operação
      saldoAcumulado += (op.resultadoTotal || 0);

      // Formatar a data de fechamento para o gráfico
      const dataFechamento = new Date(op.dataFechamento);
      const dataFormatada = `${dataFechamento.getDate().toString().padStart(2, '0')}/${(dataFechamento.getMonth() + 1).toString().padStart(2, '0')}/${dataFechamento.getFullYear()}`;

      return {
        data: dataFormatada,
        saldo: saldoAcumulado,
        operacao: op.ticker || op.nome,
        idVisual: op.idVisual
      };
    });

    // Valores para manter compatibilidade com o frontend
    const resultadoPorMes = {
      resumoPorMes: [],
      detalhesPorMes: {},
      lucroAcumulado: []
    };
    const operacoesPorMes = [];
    
    // === RANKING DE OPERAÇÕES ===
    // Melhores operações
    const melhoresOperacoes = [...operacoesFechadasPeriodo]
      .filter(op => op.resultadoTotal > 0)
      .sort((a, b) => b.resultadoTotal - a.resultadoTotal)
      .slice(0, 5)
      .map(op => {
        // Calcular ROI corretamente baseado no valor total de abertura
        const valorTotalAbertura = op.valorTotal || (op.preco * (op.quantidade || 1));
        const roi = valorTotalAbertura ? Math.round((op.resultadoTotal / valorTotalAbertura) * 100) : 'N/A';
        
        return {
          ticker: op.ticker || op.nome || 'N/A',
          idVisual: op.idVisual,
          tipo: op.tipo,
          direcao: op.direcao,
          resultado: op.resultadoTotal,
          roi: roi,
          // Incluir informação sobre operação original (no caso de fechamento parcial)
          operacaoOriginalId: op.operacaoOriginalId
        };
      });
    
    // Piores operações
    const pioresOperacoes = [...operacoesFechadasPeriodo]
      .filter(op => op.resultadoTotal < 0)
      .sort((a, b) => a.resultadoTotal - b.resultadoTotal)
      .slice(0, 5)
      .map(op => {
        // Calcular ROI corretamente baseado no valor total de abertura
        const valorTotalAbertura = op.valorTotal || (op.preco * (op.quantidade || 1));
        const roi = valorTotalAbertura ? Math.round((op.resultadoTotal / valorTotalAbertura) * 100) : 'N/A';
        
        return {
          ticker: op.ticker || op.nome || 'N/A',
          idVisual: op.idVisual,
          tipo: op.tipo,
          direcao: op.direcao,
          resultado: op.resultadoTotal,
          roi: roi,
          // Incluir informação sobre operação original (no caso de fechamento parcial)
          operacaoOriginalId: op.operacaoOriginalId
        };
      });
    
    return NextResponse.json({
      totalOperacoes,
      resultadoTotal,
      resultadoTendencia,
      taxaAcerto,
      mediaResultado,
      distribuicaoTipo,
      distribuicaoDirecao,
      // Dados vazios para gráficos mensais removidos
      resultadoPorMes: [],
      operacoesPorMes: [],
      detalhesPorMes: {},
      // Dados de lucro acumulado
      lucroAcumulado: lucroAcumulado,
      // Ranking de operações
      melhoresOperacoes,
      pioresOperacoes
    });
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    
    // Formato de erro mais detalhado para auxiliar na depuração
    const errorMessage = error.message || 'Erro desconhecido';
    const errorStack = error.stack || '';
    const errorDetails = {
      message: errorMessage,
      // Incluir apenas as primeiras 500 caracteres da stack para evitar respostas muito grandes
      stack: process.env.NODE_ENV === 'development' ? errorStack.substring(0, 500) : undefined,
      // Informações adicionais que podem ajudar no diagnóstico
      type: error.name || typeof error,
      code: error.code
    };
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar relatórios',
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}