import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import Operacao from '@/lib/models/Operacao';

// PATCH - Atualizar papel do usuário (apenas admin)
export async function PATCH(request, { params }) {
  try {
    console.log('PATCH recebido na rota de usuários');
    const userId = params.id;
    console.log('ID do usuário:', userId);
    
    const body = await request.json();
    console.log('Corpo da requisição:', body);
    const { role } = body;
    
    // Verificar se o papel é válido
    if (!['user', 'modelo', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Papel inválido' },
        { status: 400 }
      );
    }
    
    // Verificar autenticação
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Verificar se o usuário atual é administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Não permitir alterar papel de administradores (proteção adicional)
    let targetUser;
    try {
      // Tente encontrar o usuário pelo ID
      const { ObjectId } = mongoose.Types;
      targetUser = await User.findOne({ _id: new ObjectId(userId) });
      
      if (!targetUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Não é possível alterar o papel de um administrador' },
        { status: 403 }
      );
    }
    
    // Atualizar papel do usuário
    console.log(`Alterando papel do usuário ${targetUser.name} de ${targetUser.role} para ${role}`);
    targetUser.role = role;
    
    try {
      await targetUser.save();
      console.log('Usuário salvo com sucesso!');
    } catch (saveError) {
      console.error('Erro ao salvar usuário:', saveError);
      return NextResponse.json(
        { error: `Erro ao salvar usuário: ${saveError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Papel do usuário atualizado com sucesso',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE - Remover usuário (apenas admin)
export async function DELETE(request, { params }) {
  try {
    console.log('DELETE recebido na rota de usuários');
    const userId = params.id;
    console.log('ID do usuário a ser excluído:', userId);
    
    // Verificar autenticação
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Verificar se o usuário atual é administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Encontrar o usuário a ser removido
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
    
    // Não permitir remover administradores
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Não é possível remover um administrador' },
        { status: 403 }
      );
    }
    
    // Verificar e remover operações do usuário (exclusão em cascata)
    try {
      const userOperations = await Operacao.countDocuments({ userId: targetUser._id });
      
      if (userOperations > 0) {
        console.log(`Removendo ${userOperations} operações associadas ao usuário ${targetUser.name}`);
        const deleteResult = await Operacao.deleteMany({ userId: targetUser._id });
        console.log(`Operações removidas: ${deleteResult.deletedCount}`);
      }
    } catch (err) {
      console.error('Erro ao remover operações do usuário:', err);
      // Continuar com a remoção do usuário mesmo se a remoção das operações falhar
    }
    
    // Remover o usuário
    console.log(`Removendo usuário: ${targetUser.name} (${targetUser.email})`);
    await User.deleteOne({ _id: targetUser._id });
    
    return NextResponse.json({ 
      message: 'Usuário removido com sucesso',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      }
    });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao remover usuário' },
      { status: 500 }
    );
  }
}