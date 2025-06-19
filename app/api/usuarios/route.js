// app/api/usuarios/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    // Obter sessão do usuário
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
    
    await connectToDatabase();
    
    // Buscar todos os usuários, retornando apenas campos necessários
    const usuarios = await User.find({}, {
      _id: 1,
      name: 1,
      email: 1,
      role: 1
    }).sort({ name: 1 });
    
    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}