// app/api/operacoes/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import User from '@/lib/models/User';
import HistoricoOperacao from '@/lib/models/HistoricoOperacao';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Listar operacoes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    const status = searchParams.get('status');
    const origem = searchParams.get('origem');
    
    // Obter sessão do usuário para recuperar o ID
    const session = await getServerSession(authOptions);
    console.log('API: Sessão obtida:', JSON.stringify(session));
    
    if (!session?.user) {
      console.log('API: Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    console.log('API: Usuário autenticado:', session.user.id, session.user.email);
    
    await connectToDatabase();
    
    // Construir a consulta
    let query = {};
    
    console.log(`API: Recebida requisição para mes=${mes}, ano=${ano}, status=${status}`);
    
    if (mes) {
      query.mesReferencia = mes;
    }
    
    if (ano) {
      query.anoReferencia = parseInt(ano);
    }
    
    if (status) {
      query.status = status;
    }
    
    console.log('API: Query construída:', JSON.stringify(query));
    
    // Filtrar operações baseado na origem da solicitação
    if (origem === 'copytrading') {
      // Para a seção de copytrading, buscar operações de usuários modelo
      // Primeiro, precisamos buscar todos os usuários com papel 'modelo'
      const modelUsers = await User.find({ role: 'modelo' }).select('_id');
      const modelUserIds = modelUsers.map(user => user._id);
      console.log('API: Usuários modelo encontrados:', modelUserIds.length);
      
      // Filtrar operações que pertencem a usuários modelo
      query.userId = { $in: modelUserIds };
    } else {
      // Filtrar operações pelo userId do usuário autenticado
      const userId = session.user.id;
      console.log('API: Filtrando operações para o usuário:', userId);
      console.log('API: Tipo de ID:', typeof userId);
      console.log('API: ID é ObjectId válido:', mongoose.Types.ObjectId.isValid(userId));
      
      // Filtrar apenas operações do usuário atual
      query.userId = userId;
      
      console.log('API: Query final:', JSON.stringify(query));
      console.log('API: Estrutura da query:', {
        tipo: typeof query.userId,
        valor: query.userId,
        mes: query.mesReferencia,
        ano: query.anoReferencia
      });
    }
    
    // Log da consulta completa para debug
    console.log('API: Consulta completa:', JSON.stringify(query));
    
    // Opções diferentes dependendo da origem
    let operacoes;
    if (origem === 'copytrading') {
      // Para copytrading, inclua informações do usuário modelo
      operacoes = await Operacao.find(query)
        .populate('userId', 'name') // Popula o nome do usuário que criou
        .sort({ createdAt: -1 });
    } else {
      // Para operações normais, sem necessidade de dados do usuário
      operacoes = await Operacao.find(query).sort({ createdAt: -1 });
    }
    
    console.log(`API: Encontradas ${operacoes.length} operações`);
    
    return NextResponse.json({ operacoes });
  } catch (error) {
    console.error('Erro ao buscar operacoes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar operacoes' },
      { status: 500 }
    );
  }
}

// POST - Criar nova operacao
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Não precisamos mais verificar permissão especial para copytrading,
    // pois todas as operações dos usuários modelo são automaticamente expostas no copytrading
    
    // Validações básicas
    if (!data.ticker) {
      return NextResponse.json(
        { error: 'Ticker eh obrigatorio' },
        { status: 400 }
      );
    }
    
    if (!data.mesReferencia) {
      return NextResponse.json(
        { error: 'Mes de referencia eh obrigatorio' },
        { status: 400 }
      );
    }
    
    if (!data.tipo) {
      return NextResponse.json(
        { error: 'Tipo (CALL/PUT) eh obrigatorio' },
        { status: 400 }
      );
    }
    
    if (!data.direcao) {
      return NextResponse.json(
        { error: 'Direcao (COMPRA/VENDA) eh obrigatoria' },
        { status: 400 }
      );
    }
    
    if (data.strike === undefined || data.strike === null || isNaN(parseFloat(data.strike))) {
      return NextResponse.json(
        { error: 'Strike eh obrigatorio e deve ser um numero valido' },
        { status: 400 }
      );
    }
    
    if (data.preco === undefined || data.preco === null || isNaN(parseFloat(data.preco))) {
      return NextResponse.json(
        { error: 'Preco eh obrigatorio e deve ser um numero valido' },
        { status: 400 }
      );
    }
    
    // Validar quantidade (se fornecida)
    let quantidade = 1; // Valor padrão
    if (data.quantidade !== undefined) {
      const qteTemp = parseInt(data.quantidade);
      if (isNaN(qteTemp) || qteTemp <= 0) {
        return NextResponse.json(
          { error: 'Quantidade deve ser um número positivo' },
          { status: 400 }
        );
      }
      quantidade = qteTemp;
    }
    
    // Validar valores específicos
    const mesesValidos = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    // Normalizar o mês para minúsculas para lidar com casos como 'Abril' vs 'abril'
    const mesReferenciaNormalizado = data.mesReferencia ? data.mesReferencia.toLowerCase() : '';
    
    // Mapear nomes de meses com acentos para versões sem acentos
    const mapeamentoMeses = {
      'janeiro': 'janeiro',
      'fevereiro': 'fevereiro',
      'março': 'marco',
      'marco': 'marco',
      'abril': 'abril',
      'maio': 'maio',
      'junho': 'junho',
      'julho': 'julho',
      'agosto': 'agosto',
      'setembro': 'setembro',
      'outubro': 'outubro',
      'novembro': 'novembro',
      'dezembro': 'dezembro'
    };
    
    // Obter mês normalizado
    const mesReferencia = mapeamentoMeses[mesReferenciaNormalizado];
    
    if (!mesReferencia || !mesesValidos.includes(mesReferencia)) {
      return NextResponse.json(
        { error: `Mês de referência inválido: "${data.mesReferencia}". Deve ser um dos valores: ${mesesValidos.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Substituir o valor original pelo normalizado
    data.mesReferencia = mesReferencia;
    
    // Validar e converter ano para número
    let anoReferencia = new Date().getFullYear();
    if (data.anoReferencia) {
      anoReferencia = parseInt(data.anoReferencia);
      if (isNaN(anoReferencia)) {
        return NextResponse.json(
          { error: 'Ano de referência inválido' },
          { status: 400 }
        );
      }
    }
    
    const tiposValidos = ['CALL', 'PUT'];
    if (!tiposValidos.includes(data.tipo)) {
      return NextResponse.json(
        { error: 'Tipo invalido. Deve ser CALL ou PUT' },
        { status: 400 }
      );
    }
    
    const direcoesValidas = ['COMPRA', 'VENDA'];
    if (!direcoesValidas.includes(data.direcao)) {
      return NextResponse.json(
        { error: 'Direcao invalida. Deve ser COMPRA ou VENDA' },
        { status: 400 }
      );
    }
    
    console.log('Dados recebidos para criar operação:', data);
    console.log('Tipo do mês de referência:', typeof data.mesReferencia);
    console.log('Valor do mês de referência:', data.mesReferencia);
    console.log('Mês está na lista de valores válidos:', mesesValidos.includes(data.mesReferencia));
    
    await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Montar objeto de operação
    const preco = parseFloat(data.preco);
    
    // Verificar novamente valores enum
    if (!mesesValidos.includes(data.mesReferencia)) {
      return NextResponse.json(
        { error: `Mês de referência inválido: "${data.mesReferencia}". Deve ser um dos valores: ${mesesValidos.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Usar margem apenas se foi informada explicitamente
    let margemUtilizada = 0;
    if (data.margemUtilizada && !isNaN(parseFloat(data.margemUtilizada))) {
      margemUtilizada = parseFloat(data.margemUtilizada);
    }

    const operacaoData = {
      nome: data.ticker, // Manter compatibilidade atribuindo ticker ao nome também
      ticker: data.ticker,
      mesReferencia: mesReferencia, // Usar a versão normalizada
      anoReferencia: anoReferencia,
      tipo: data.tipo,
      direcao: data.direcao,
      strike: parseFloat(data.strike),
      preco: preco,
      quantidade: quantidade,
      valorTotal: preco * quantidade,
      margemUtilizada: margemUtilizada,
      observacoes: data.observacoes || '',
      corEstrategia: data.corEstrategia || null,
      userId: session.user.id,
    };
    
    console.log('Criando nova operação com dados:', operacaoData);
    const novaOperacao = new Operacao(operacaoData);
    
    // Tentar validar o modelo antes de salvar
    try {
      await novaOperacao.validate();
      console.log('Validação do modelo bem-sucedida');
    } catch (validationError) {
      console.error('Erro de validação:', validationError);
      console.error('Nome do erro:', validationError.name);
      console.error('Código do erro:', validationError.code);
      console.error('Caminho com erro:', validationError.errors ? Object.keys(validationError.errors) : 'Desconhecido');
      
      // Retornar um erro mais descritivo
      if (validationError.errors) {
        const errorMessages = Object.entries(validationError.errors).map(([field, error]) => 
          `${field}: ${error.message} (valor recebido: ${error.value})`
        ).join(', ');
        
        return NextResponse.json(
          { error: `Erro de validação: ${errorMessages}` },
          { status: 400 }
        );
      }
      
      throw validationError;
    }
    
    // Salvar no banco
    console.log('Salvando operação...');
    await novaOperacao.save();
    console.log('Operação salva com sucesso! ID:', novaOperacao._id);
    
    // Verificar se o usuário é modelo e registrar no histórico
    console.log('Verificando se usuário é modelo. User ID:', session.user.id);
    const usuario = await User.findById(session.user.id);
    console.log('Usuário encontrado:', usuario ? { id: usuario._id, role: usuario.role, name: usuario.name } : 'null');
    
    if (usuario && usuario.role === 'modelo') {
      console.log('Usuário é modelo, registrando no histórico...');
      
      try {
        const historicoData = {
          userId: session.user.id,
          operacaoId: novaOperacao._id.toString(),
          nome: operacaoData.nome,
          tipo: operacaoData.tipo,
          direcao: operacaoData.direcao,
          quantidade: operacaoData.quantidade,
          dataOperacao: novaOperacao.dataAbertura,
          ticker: operacaoData.ticker,
          strike: operacaoData.strike,
          preco: operacaoData.preco,
          mesReferencia: operacaoData.mesReferencia,
          anoReferencia: operacaoData.anoReferencia
        };
        
        console.log('Dados do histórico:', historicoData);
        const novoHistorico = new HistoricoOperacao(historicoData);
        await novoHistorico.save();
        console.log('Operação registrada no histórico com sucesso! ID:', novoHistorico._id);
      } catch (historicoError) {
        console.error('Erro ao registrar no histórico:', historicoError);
        console.error('Stack trace:', historicoError.stack);
        // Não falhar a operação principal por causa do histórico
      }
    } else {
      console.log('Usuário não é modelo, não registrando no histórico');
    }
    
    return NextResponse.json(novaOperacao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar operacao:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar operacao' },
      { status: 500 }
    );
  }
}