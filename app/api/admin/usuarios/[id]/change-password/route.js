import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// PATCH - Alterar senha de outro usuário (apenas admin)
export async function PATCH(request, { params }) {
  try {
    const userId = params.id;
    
    const body = await request.json();
    const { newPassword } = body;
    
    // Validar senha
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Verificar se o usuário atual é administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 });
    }
    
    // Encontrar o usuário alvo
    let targetUser;
    try {
      const { ObjectId } = mongoose.Types;
      targetUser = await User.findOne({ _id: new ObjectId(userId) });
      
      if (!targetUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Criptografar nova senha (usando mesmo método do register)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔧 Admin alterando senha do usuário ${targetUser.email}`);
    console.log(`🔧 Nova senha hash: ${hashedPassword.substring(0, 20)}...`);
    
    // Atualizar senha do usuário
    targetUser.password = hashedPassword;
    await targetUser.save();
    
    console.log(`✅ Senha alterada com sucesso para ${targetUser.email}`);
    
    return NextResponse.json({ 
      message: 'Senha alterada com sucesso',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      }
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}