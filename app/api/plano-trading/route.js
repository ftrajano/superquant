// app/api/plano-trading/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/db/mongodb';
import User from '../../../lib/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retornar plano de trading ou valores padrão
    const planoTrading = user.planoTrading || {
      capitalDisponivel: 0,
      percentualReserva: 20,
      percentualPorOperacao: 25,
      ultimaAtualizacao: null
    };

    return NextResponse.json(planoTrading);
  } catch (error) {
    console.error('Erro ao buscar plano de trading:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectToDatabase();

    const dados = await request.json();
    const { capitalDisponivel, percentualReserva, percentualPorOperacao } = dados;

    // Validar dados
    if (capitalDisponivel < 0) {
      return NextResponse.json({ error: 'Capital disponível deve ser positivo' }, { status: 400 });
    }

    if (percentualReserva < 0 || percentualReserva > 100) {
      return NextResponse.json({ error: 'Percentual de reserva deve estar entre 0 e 100' }, { status: 400 });
    }

    if (percentualPorOperacao < 0 || percentualPorOperacao > 100) {
      return NextResponse.json({ error: 'Percentual por operação deve estar entre 0 e 100' }, { status: 400 });
    }

    // Calcular valor mensal
    const reserva = (capitalDisponivel * percentualReserva) / 100;
    const capitalParaTrade = capitalDisponivel - reserva;
    const valorMensal = capitalParaTrade / 6; // Dividir por 6 meses

    // Atualizar plano de trading do usuário
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          'planoTrading.capitalDisponivel': capitalDisponivel,
          'planoTrading.percentualReserva': percentualReserva,
          'planoTrading.percentualPorOperacao': percentualPorOperacao,
          'planoTrading.valorMensal': valorMensal,
          'planoTrading.updatedAt': new Date()
        }
      },
      { new: true, upsert: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('Plano de trading atualizado:', {
      userId: session.user.id,
      capitalDisponivel,
      percentualReserva,
      percentualPorOperacao,
      valorMensal
    });

    return NextResponse.json({
      message: 'Plano de trading salvo com sucesso',
      planoTrading: user.planoTrading
    });
  } catch (error) {
    console.error('Erro ao salvar plano de trading:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}