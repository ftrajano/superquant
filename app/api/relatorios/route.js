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

// Função que gera dados para o gráfico de resultado por mês e operações detalhadas
const agruparResultadosPorMes = (operacoes) => {
  console.log(`Recebidas ${operacoes.length} operações para processar`);
  
  // Se não temos operações, retornar arrays vazios
  if (!operacoes || operacoes.length === 0) {
    console.log('Sem operações, retornando dados vazios.');
    return {
      resumoPorMes: [],
      detalhesPorMes: {}
    };
  }
  
  // Para cada operação fechada, verificar se tem os dados necessários
  // Em caso de ausência de dados, atribuir valores padrão
  const dadosProcessados = operacoes.map(op => {
    // Verificar status - aceitar tanto "Fechada" quanto "Parcialmente Fechada"
    // Também aceitar operações que são resultado de fechamento parcial (têm operacaoOriginalId)
    const isFechada = op.status === 'Fechada' || op.operacaoOriginalId || op.status === 'Parcialmente Fechada';
    
    if (!isFechada) {
      console.log(`Operação ${op._id} não está fechada, status: ${op.status}`);
      return null;
    }
    
    // Operações que são resultados de fechamento parcial já têm seus próprios resultados
    // Operações parcialmente fechadas não devem ser incluídas diretamente no cálculo,
    // pois seus resultados já estão nas operações derivadas
    if (op.status === 'Parcialmente Fechada' && !op.operacaoOriginalId) {
      console.log(`Operação ${op._id} está parcialmente fechada, seus resultados já estão contabilizados em operações derivadas`);
      return null;
    }
    
    // Verificar dataFechamento
    if (!op.dataFechamento) {
      console.log(`Operação ${op._id} não tem dataFechamento, usando dataAbertura`);
      // Se não tiver dataFechamento, usa dataAbertura
      op.dataFechamento = op.dataAbertura;
    }
    
    // Verificar resultadoTotal
    if (op.resultadoTotal === undefined || op.resultadoTotal === null) {
      console.log(`Operação ${op._id} não tem resultadoTotal, usando 0`);
      // Se não tiver resultadoTotal, define como 0
      op.resultadoTotal = 0;
    }
    
    // Preparar informações sobre a origem da operação (se for resultado de fechamento parcial)
    let origemInfo = '';
    if (op.operacaoOriginalId) {
      origemInfo = ` (Fechamento parcial de ${op.operacaoOriginalId})`;
    }
    
    // Calcular ROI corretamente baseado no valor total de abertura
    const valorTotalAbertura = op.valorTotal || (op.preco * (op.quantidade || 1));
    const roi = valorTotalAbertura ? Math.round((op.resultadoTotal / valorTotalAbertura) * 100) : 0;
    
    return {
      id: op._id.toString(),
      ticker: op.ticker || op.nome || 'N/A', 
      idVisual: op.idVisual,
      tipo: op.tipo,
      direcao: op.direcao,
      preco: op.preco,
      quantidade: op.quantidade || 1,
      precoFechamento: op.precoFechamento,
      dataAbertura: op.dataAbertura,
      dataFechamento: op.dataFechamento,
      resultado: op.resultadoTotal,
      valorTotalAbertura: valorTotalAbertura,
      valorTotalFechamento: op.valorTotalFechamento || (op.precoFechamento * (op.quantidade || 1)),
      roi: roi,
      operacaoOriginalId: op.operacaoOriginalId,
      observacoes: (op.observacoes || '') + origemInfo
    };
  }).filter(item => item !== null);  // remove itens nulos
  
  console.log(`${dadosProcessados.length} operações válidas após filtragem`);
  
  // Se não temos dados processados válidos, retornar arrays vazios
  if (dadosProcessados.length === 0) {
    console.log('Sem operações processáveis, retornando dados vazios.');
    return {
      resumoPorMes: [],
      detalhesPorMes: {}
    };
  }
  
  // Agrupar por mês
  const resultadosPorMes = {};
  const operacoesPorMes = {};
  
  dadosProcessados.forEach(op => {
    const data = new Date(op.dataFechamento);
    const mes = data.getMonth();
    const ano = data.getFullYear();
    
    // Formatar "Mmm/YY" (ex: "Abr/24")
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesFormatado = `${meses[mes]}/${String(ano).slice(2)}`;
    
    // Inicializar arrays e contadores se não existirem
    if (!resultadosPorMes[mesFormatado]) {
      resultadosPorMes[mesFormatado] = 0;
      operacoesPorMes[mesFormatado] = [];
    }
    
    // Adicionar resultado ao total do mês
    resultadosPorMes[mesFormatado] += op.resultado;
    
    // Adicionar operação completa ao array do mês
    operacoesPorMes[mesFormatado].push(op);
  });
  
  // Converter resumo para array e ordenar
  const resumoPorMes = Object.entries(resultadosPorMes).map(([mes, valor]) => ({
    mes, 
    resultado: valor
  })).sort((a, b) => {
    const [mesA, anoA] = a.mes.split('/');
    const [mesB, anoB] = b.mes.split('/');
    
    // Comparar anos primeiro
    if (anoA !== anoB) {
      return parseInt(anoA) - parseInt(anoB);
    }
    
    // Se anos iguais, comparar meses
    const mesesIndice = {
      'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
      'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
    };
    
    return mesesIndice[mesA] - mesesIndice[mesB];
  });
  
  // Ordenar operações dentro de cada mês por data de fechamento
  Object.keys(operacoesPorMes).forEach(mes => {
    operacoesPorMes[mes].sort((a, b) => 
      new Date(a.dataFechamento) - new Date(b.dataFechamento)
    );
  });
  
  // Se não temos resultados, retornar arrays vazios
  if (resumoPorMes.length === 0) {
    console.log('Nenhum mês com dados, retornando dados vazios.');
    return {
      resumoPorMes: [],
      detalhesPorMes: {}
    };
  }
  
  console.log('Dados por mês gerados:', resumoPorMes);
  console.log('Detalhes por mês disponíveis para:', Object.keys(operacoesPorMes));
  
  return {
    resumoPorMes: resumoPorMes,
    detalhesPorMes: operacoesPorMes
  };
};

// Função para agrupar quantidade de operações por mês (para todas as operações)
const agruparOperacoesPorMes = (operacoes) => {
  console.log('=== DEBUG: agruparOperacoesPorMes ===');
  console.log(`Número de operações recebidas: ${operacoes.length}`);
  
  // Se não temos operações, retornamos um array vazio
  if (operacoes.length === 0) {
    console.log('Nenhuma operação encontrada para o período');
    return [];
  }
  
  // Registrar meses e anos disponíveis para debug
  const mesesDisponiveis = new Set();
  operacoes.forEach(op => {
    if (op.dataAbertura) {
      const data = new Date(op.dataAbertura);
      const mesFormatado = formatarMes(data);
      mesesDisponiveis.add(mesFormatado);
    }
  });
  console.log('Meses disponíveis para operações:', [...mesesDisponiveis]);
  
  const mesesMap = {}; // {mes-ano: quantidade}
  
  // Garantir que todos os meses disponíveis estejam inicializados
  mesesDisponiveis.forEach(mes => {
    mesesMap[mes] = 0;
  });
  
  // Contabilizar operações por mês de abertura
  operacoes.forEach(op => {
    if (!op.dataAbertura) {
      console.log(`Operação ${op._id} ignorada: não tem dataAbertura`);
      return;
    }
    
    const data = new Date(op.dataAbertura);
    const mesFormatado = formatarMes(data);
    
    mesesMap[mesFormatado] += 1;
  });
  
  console.log('Contagem por mês:', mesesMap);
  
  // Converter para array para o gráfico
  const resultado = Object.keys(mesesMap).map(mes => ({
    mes,
    quantidade: mesesMap[mes]
  })).sort((a, b) => {
    const [mesA, anoA] = a.mes.split('/');
    const [mesB, anoB] = b.mes.split('/');
    if (anoA !== anoB) return anoA - anoB;
    const mesesIndice = {'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5, 
                        'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11};
    return mesesIndice[mesA] - mesesIndice[mesB];
  });
  
  console.log('Resultado final de operações por mês:', resultado);
  return resultado;
};

// GET - Buscar dados para relatórios
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'ultimos3meses';
    
    // Lista de meses válidos para referência
    const mesesValidos = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                         'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    // Obter a sessão de autenticação para recuperar o ID do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Obter o ID do usuário atual para filtrar as operações
    const userId = session.user.id;
    console.log('API Relatórios: Filtrando por userId:', userId);
    
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
      
      // Adicionar as condições ao $or existente
      queryOperacoesFechadas.$or = queryOperacoesFechadas.$or.concat(condicoesMesAno);
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
      
      // Adicionar as condições ao $or existente
      queryOperacoesFechadas.$or = queryOperacoesFechadas.$or.concat(condicoesData);
    }
    
    console.log('Query para operações fechadas:', JSON.stringify(queryOperacoesFechadas));
    
    const operacoesFechadasPeriodo = await Operacao.find(queryOperacoesFechadas)
      .sort({ dataFechamento: -1 });
      
    console.log(`Encontradas ${operacoesFechadasPeriodo.length} operações fechadas`);
    
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
    
    console.log('Query para todas operações:', JSON.stringify(queryTodasOperacoes));
    
    const todasOperacoes = await Operacao.find(queryTodasOperacoes)
      .sort({ dataAbertura: -1 });
      
    console.log(`Encontradas ${todasOperacoes.length} operações no total`);
    
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
    
    console.log(`${operacoesParaMetricas.length} operações filtradas para cálculo de métricas`);
    
    // === MÉTRICAS GERAIS ===
    const totalOperacoes = todasOperacoes.length;
    const resultadoTotal = operacoesParaMetricas.reduce((sum, op) => sum + (op.resultadoTotal || 0), 0);
    const operacoesLucrativas = operacoesParaMetricas.filter(op => op.resultadoTotal > 0).length;
    const taxaAcerto = operacoesParaMetricas.length > 0 
      ? Math.round((operacoesLucrativas / operacoesParaMetricas.length) * 100)
      : 0;
    const mediaResultado = operacoesParaMetricas.length > 0
      ? resultadoTotal / operacoesParaMetricas.length
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
    
    console.log('Query para período anterior:', JSON.stringify(queryPeriodoAnterior));
    const operacoesPeriodoAnterior = await Operacao.find(queryPeriodoAnterior);
    
    // Aplicar a mesma lógica de filtragem que usamos para o período atual
    const operacoesAnterioresParaMetricas = operacoesPeriodoAnterior.filter(op => {
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
    
    console.log(`Total de operações encontradas: ${todasOperacoes.length}, das quais ${operacoesFechadasPeriodo.length} estão fechadas`);
    
    // === DADOS PARA O GRÁFICO DE RESULTADO POR MÊS ===
    // Buscar apenas operações do usuário atual para o gráfico de resultados
    const operacoesParaGrafico = await Operacao.find({
      userId: userId, // Apenas operações do usuário atual, não mostrar operações sem userId
      $or: [
        // Operações fechadas completamente
        { status: 'Fechada' },
        // Operações resultantes de fechamento parcial
        { operacaoOriginalId: { $ne: null } }
      ]
    });
    
    console.log(`Operações fechadas para o gráfico: ${operacoesParaGrafico.length}`);
    
    // Gerar dados para o gráfico usando operações fechadas e operações de fechamento parcial
    const resultadoPorMes = agruparResultadosPorMes(operacoesParaGrafico);
    console.log("Utilizando dados processados para o gráfico");
    
    // Para quantidade de operações por mês, usamos todas as operações do período selecionado
    const operacoesPorMes = agruparOperacoesPorMes(todasOperacoes);
    
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
      resultadoPorMes: resultadoPorMes.resumoPorMes,
      operacoesPorMes,
      detalhesPorMes: resultadoPorMes.detalhesPorMes,
      melhoresOperacoes,
      pioresOperacoes
    });
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatórios' },
      { status: 500 }
    );
  }
}