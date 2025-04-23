// app/api/fix-users/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Obter sessão do usuário para recuperar o ID (somente admin pode executar)
    const session = await getServerSession(authOptions);
    console.log('API: Sessão obtida:', JSON.stringify(session));
    
    if (!session?.user || session.user.role !== 'admin') {
      console.log('API: Acesso não autorizado para fix-users');
      return NextResponse.json(
        { error: 'Acesso não autorizado. Apenas administradores podem usar esta funcionalidade.' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Buscar operações sem userId
    const operacoesSemUserId = await Operacao.find({ userId: { $exists: false } });
    
    console.log(`Encontradas ${operacoesSemUserId.length} operações sem userId`);
    
    if (operacoesSemUserId.length === 0) {
      return NextResponse.json({
        message: 'Não foram encontradas operações sem userId',
        count: 0
      });
    }
    
    // Obter o primeiro usuário administrador para atribuir
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      return NextResponse.json({
        error: 'Não foi encontrado nenhum usuário administrador para atribuir às operações',
        count: 0
      }, { status: 404 });
    }
    
    // Atribuir userId para cada operação
    let operacoesAtualizadas = 0;
    
    for (const operacao of operacoesSemUserId) {
      operacao.userId = adminUser._id;
      await operacao.save();
      operacoesAtualizadas++;
    }
    
    return NextResponse.json({
      message: `${operacoesAtualizadas} operações foram atualizadas com sucesso`,
      count: operacoesAtualizadas,
      adminUserId: adminUser._id.toString()
    });
  } catch (error) {
    console.error('Erro ao corrigir operações sem userId:', error);
    return NextResponse.json(
      { error: 'Erro ao corrigir operações sem userId', detalhes: error.message },
      { status: 500 }
    );
  }
}