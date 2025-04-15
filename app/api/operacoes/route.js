// app/api/operacoes/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';

// GET - Listar operacoes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const status = searchParams.get('status');
    
    await connectToDatabase();
    
    let query = {};
    if (mes) {
      query.mesReferencia = mes;
    }
    if (status) {
      query.status = status;
    }
    
    const operacoes = await Operacao.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(operacoes);
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
    
    // Validações básicas
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome da operacao eh obrigatorio' },
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
    
    // Validar valores específicos
    const mesesValidos = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    if (!mesesValidos.includes(data.mesReferencia)) {
      return NextResponse.json(
        { error: 'Mes de referencia invalido' },
        { status: 400 }
      );
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
    
    await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Montar objeto de operação
    const operacaoData = {
      nome: data.nome,
      mesReferencia: data.mesReferencia,
      tipo: data.tipo,
      direcao: data.direcao,
      strike: parseFloat(data.strike),
      preco: parseFloat(data.preco),
      observacoes: data.observacoes || '',
    };
    
    console.log('Criando nova operação com dados:', operacaoData);
    const novaOperacao = new Operacao(operacaoData);
    
    // Tentar validar o modelo antes de salvar
    try {
      await novaOperacao.validate();
      console.log('Validação do modelo bem-sucedida');
    } catch (validationError) {
      console.error('Erro de validação:', validationError);
      throw validationError;
    }
    
    // Salvar no banco
    console.log('Salvando operação...');
    await novaOperacao.save();
    console.log('Operação salva com sucesso! ID:', novaOperacao._id);
    
    return NextResponse.json(novaOperacao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar operacao:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar operacao' },
      { status: 500 }
    );
  }
}