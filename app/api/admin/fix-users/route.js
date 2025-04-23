import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // Verificar se o usuário é administrador
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role === 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Apenas administradores podem usar esta funcionalidade.' },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    // Pegar parâmetros da URL
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'atribuir'; // atribuir ou remover
    const userId = searchParams.get('userId') || session.user.id; // ID do usuário a atribuir
    
    // Acessar diretamente a coleção de operações
    const db = mongoose.connection.db;
    const operacoesCollection = db.collection('operacaos');
    
    let result;
    
    if (action === 'atribuir') {
      // Atribuir o userId logado a todas operações sem userId
      result = await operacoesCollection.updateMany(
        { 
          $or: [
            { userId: { $exists: false } },
            { userId: null }
          ]
        },
        { $set: { userId: userId } }
      );
      
      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} operações atualizadas com o seu userId`,
        result
      });
    } 
    else if (action === 'remover') {
      // Remover todas operações sem userId
      result = await operacoesCollection.deleteMany({
        $or: [
          { userId: { $exists: false } },
          { userId: null }
        ]
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} operações sem userId foram removidas`,
        result
      });
    }
    else if (action === 'limpar') {
      // Remover TODAS as operações (CUIDADO!)
      result = await operacoesCollection.deleteMany({});
      
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} operações foram removidas`,
        result
      });
    }
    else {
      return NextResponse.json({
        error: 'Ação inválida. Use "atribuir", "remover" ou "limpar"'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao corrigir operações:', error);
    return NextResponse.json(
      { error: 'Erro ao corrigir operações', detalhes: error.message },
      { status: 500 }
    );
  }
}