// app/api/operacoes/usuario/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    const userId = searchParams.get('userId');
    
    // Obter sessão do usuário para verificar permissões
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário é modelo ou admin
    if (session.user.role !== 'modelo' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas usuários modelo e admin podem acessar esta funcionalidade.' },
        { status: 403 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Construir a consulta
    let query = { userId: userId };
    
    if (mes) {
      query.mesReferencia = mes;
    }
    
    if (ano) {
      query.anoReferencia = parseInt(ano);
    }
    
    console.log('API: Buscando operações para usuário:', userId);
    console.log('API: Query construída:', JSON.stringify(query));
    
    // Buscar operações do usuário específico
    const operacoes = await Operacao.find(query).sort({ createdAt: -1 });
    
    console.log(`API: Encontradas ${operacoes.length} operações para o usuário ${userId}`);
    
    return NextResponse.json({ operacoes });
  } catch (error) {
    console.error('Erro ao buscar operações do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar operações do usuário' },
      { status: 500 }
    );
  }
}