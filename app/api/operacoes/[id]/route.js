// app/api/operacoes/[id]/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import HistoricoOperacao from '@/lib/models/HistoricoOperacao';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obter uma operacao por ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const operacao = await Operacao.findById(id);
    
    if (!operacao) {
      return NextResponse.json(
        { error: 'Operacao nao encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(operacao);
  } catch (error) {
    console.error('Erro ao buscar operacao:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar operacao' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar operacao
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const operacaoExistente = await Operacao.findById(id);
    
    if (!operacaoExistente) {
      return NextResponse.json(
        { error: 'Operacao nao encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é dono da operação
    if (operacaoExistente.userId && operacaoExistente.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }
    
    if (data.mesReferencia) {
      const mesesValidos = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      
      if (!mesesValidos.includes(data.mesReferencia)) {
        return NextResponse.json(
          { error: 'Mes invalido' },
          { status: 400 }
        );
      }
    }
    
    if (data.status) {
      const statusValidos = ['Aberta', 'Fechada', 'Parcialmente Fechada'];
      
      if (!statusValidos.includes(data.status)) {
        return NextResponse.json(
          { error: 'Status invalido' },
          { status: 400 }
        );
      }
    }
    
    const operacaoAtualizada = await Operacao.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(operacaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar operacao:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar operacao' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir operacao
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const operacao = await Operacao.findById(id);
    
    if (!operacao) {
      return NextResponse.json(
        { error: 'Operacao nao encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é dono da operação
    if (operacao.userId && operacao.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }
    
    // Excluir a operação
    await Operacao.findByIdAndDelete(id);
    
    // Remover do histórico se existir
    try {
      await HistoricoOperacao.deleteOne({ operacaoId: id });
      console.log('Registro removido do histórico para operação:', id);
    } catch (historicoError) {
      console.error('Erro ao remover do histórico:', historicoError);
      // Não falhar a exclusão principal por causa do histórico
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir operacao:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir operacao' },
      { status: 500 }
    );
  }
}