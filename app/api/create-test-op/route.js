// app/api/create-test-op/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    // Verificar se é modo aberto ou autenticado
    const { searchParams } = new URL(request.url);
    const modoAberto = searchParams.get('aberto') === 'true';
    const mes = searchParams.get('mes') || 'abril';
    const ano = searchParams.get('ano') || '2025';
    const status = searchParams.get('status') || 'Aberta';
    const fechar = searchParams.get('fechar') === 'true';
    
    let userId = null;
    
    // Se não estiver em modo aberto, exige autenticação
    if (!modoAberto) {
      // Obter sessão do usuário atual
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Não autenticado. Faça login para criar operação de teste.' },
          { status: 401 }
        );
      }
      
      userId = session.user.id;
    }
    
    await connectToDatabase();
    
    // Criar operação de teste
    const timestamp = Date.now();
    const operacaoTeste = new Operacao({
      nome: `Operação de Teste ${timestamp}`,
      ticker: 'PETR4',
      tipo: 'CALL',
      direcao: 'COMPRA',
      strike: 30.0,
      preco: 1.5,
      mesReferencia: mes,
      anoReferencia: parseInt(ano),
      observacoes: 'Operação criada para teste de exibição',
      status: status
    });
    
    // Adicionar userId se disponível
    if (userId) {
      operacaoTeste.userId = userId;
    }
    
    // Se o status for Fechada ou se a flag fechar estiver ativa, adicionar dados de fechamento
    if (status === 'Fechada' || fechar) {
      operacaoTeste.status = 'Fechada';
      operacaoTeste.dataFechamento = new Date();
      operacaoTeste.precoFechamento = 2.0;
      operacaoTeste.resultadoTotal = 50; // (precoFechamento - preco) * quantidade
    }
    
    await operacaoTeste.save();
    
    return NextResponse.json({
      success: true,
      message: 'Operação de teste criada com sucesso',
      operacao: operacaoTeste
    });
  } catch (error) {
    console.error('Erro ao criar operação de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao criar operação de teste', detalhes: error.message },
      { status: 500 }
    );
  }
}