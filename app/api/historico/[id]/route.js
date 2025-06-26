// app/api/historico/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import HistoricoOperacao from '../../../../lib/models/HistoricoOperacao';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectToDatabase();
    
    const historico = await HistoricoOperacao.findById(params.id);
    if (!historico) {
      return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
    }

    // Verificar permissões: usuário modelo pode ver suas próprias operações, admin pode ver qualquer uma
    if (session.user.role !== 'admin' && session.user.role !== 'modelo') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    if (session.user.role === 'modelo' && historico.userId !== session.user.id) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    return NextResponse.json(historico);
  } catch (error) {
    console.error('Erro ao buscar operação do histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'modelo') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    await connectToDatabase();
    
    const historico = await HistoricoOperacao.findById(params.id);
    if (!historico) {
      return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
    }

    // Usuário modelo só pode editar suas próprias operações
    if (session.user.role === 'modelo' && historico.userId !== session.user.id) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const dados = await request.json();
    
    // Atualizar campos permitidos
    const camposPermitidos = [
      'ticker', 'tipo', 'direcao', 'strike', 'preco', 'quantidade',
      'dataOperacao', 'dataVencimento', 'status', 'observacoes',
      'corEstrategia', 'nomeEstrategia'
    ];

    camposPermitidos.forEach(campo => {
      if (dados[campo] !== undefined) {
        historico[campo] = dados[campo];
      }
    });

    await historico.save();

    return NextResponse.json(historico);
  } catch (error) {
    console.error('Erro ao atualizar operação do histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'modelo') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    await connectToDatabase();
    
    const historico = await HistoricoOperacao.findById(params.id);
    if (!historico) {
      return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
    }

    // Usuário modelo só pode excluir suas próprias operações
    if (session.user.role === 'modelo' && historico.userId !== session.user.id) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    await HistoricoOperacao.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Operação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir operação do histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}