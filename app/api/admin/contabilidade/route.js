import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';
import RelatorioContabil from '../../../../lib/models/RelatorioContabil';

// GET - Buscar dados contábeis (relatórios existentes e assinaturas pendentes)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'modelo')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores e usuários modelo podem acessar.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Buscar relatórios contábeis existentes (ordenados por data de fechamento)
    const relatorios = await RelatorioContabil.find({})
      .sort({ dataFechamento: -1 })
      .limit(12);

    // Buscar o último fechamento para determinar o período atual
    const ultimoFechamento = await RelatorioContabil.findOne({})
      .sort({ dataFechamento: -1 });

    // Data de início do período atual (data do último fechamento ou início do sistema)
    const inicioperiodoAtual = ultimoFechamento
      ? ultimoFechamento.dataFechamento
      : new Date('2020-01-01'); // Data bem antiga para pegar tudo no primeiro fechamento

    // Buscar assinaturas pendentes (ativas criadas/ativadas após último fechamento)
    const assinaturasPendentes = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
          'subscription.lastPaymentDate': { $exists: true },
          'subscription.lastPaymentAmount': { $gt: 0 },
          'subscription.startDate': { $gt: inicioperiodoAtual } // Apenas assinaturas após último fechamento
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          plano: '$subscription.plan',
          valor: '$subscription.lastPaymentAmount',
          dataInicio: '$subscription.startDate',
          dataExpiracao: '$subscription.expirationDate',
          dataUltimoPagamento: '$subscription.lastPaymentDate'
        }
      }
    ]);

    const periodoAtual = {
      inicio: inicioperiodoAtual,
      quantidadePendente: assinaturasPendentes.length
    };

    return NextResponse.json({
      success: true,
      relatorios,
      assinaturasPendentes,
      periodoAtual
    });

  } catch (error) {
    console.error('Erro ao buscar dados contábeis:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}