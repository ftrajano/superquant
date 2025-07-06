// app/api/usuarios/buscar/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissões - apenas modelo e admin podem buscar usuários
    if (session.user.role !== 'modelo' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (!query || query.length < 1) {
      return NextResponse.json({ 
        error: 'Query deve ter pelo menos 1 caractere',
        usuarios: []
      }, { status: 400 });
    }

    // Criar regex para busca case-insensitive
    const searchRegex = new RegExp(query, 'i');

    // Buscar usuários que correspondem ao nome ou email
    const usuarios = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    })
    .select('_id name email role createdAt')
    .limit(limit)
    .sort({ name: 1 })
    .lean();

    return NextResponse.json({
      usuarios,
      total: usuarios.length,
      query: query
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}