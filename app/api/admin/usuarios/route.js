import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

// GET - Listar todos os usuários (apenas para admin)
export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    console.log('Session:', session);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    console.log('Email da sessão:', session.user.email);

    // Verificar se é administrador
    await connectToDatabase();
    
    // Alteração importante: session.user.id pode não estar disponível, vamos usar email para busca
    const currentUser = await User.findOne({ email: session.user.email });
    console.log('Usuário encontrado:', currentUser ? 'Sim' : 'Não');
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar todos os usuários
    console.log('Buscando todos os usuários...');
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    console.log(`Encontrados ${users.length} usuários.`);
    if (users.length > 0) {
      console.log('Primeiro usuário:', {
        id: users[0]._id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role
      });
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}