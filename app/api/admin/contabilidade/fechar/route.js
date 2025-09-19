import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/db/mongodb';
import User from '../../../../../lib/models/User';
import RelatorioContabil from '../../../../../lib/models/RelatorioContabil';
import { SUBSCRIPTION_PLANS } from '../../../../../lib/subscription';

// POST - Fechar contabilidade do período atual
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem fechar contabilidade.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Buscar o último fechamento para determinar o período
    const ultimoFechamento = await RelatorioContabil.findOne({})
      .sort({ dataFechamento: -1 });

    // Data de início do período atual (data do último fechamento ou início do sistema)
    const inicioperiodoAtual = ultimoFechamento
      ? ultimoFechamento.dataFechamento
      : new Date('2020-01-01'); // Data bem antiga para pegar tudo no primeiro fechamento

    const dataFechamentoAtual = new Date();

    // Buscar assinaturas a serem contabilizadas (ativas criadas após último fechamento)
    const assinaturasParaContabilizar = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
          'subscription.lastPaymentDate': { $exists: true },
          'subscription.lastPaymentAmount': { $gt: 0 },
          'subscription.startDate': { $gt: inicioperiodoAtual } // Apenas após último fechamento
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          'subscription.plan': 1,
          'subscription.lastPaymentAmount': 1,
          'subscription.startDate': 1
        }
      }
    ]);

    if (assinaturasParaContabilizar.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura nova encontrada para contabilizar desde o último fechamento' },
        { status: 400 }
      );
    }

    // Separar por tipo de assinatura e calcular totais
    const breakdown = {
      monthly: { quantidade: 0, total: 0 },
      quarterly: { quantidade: 0, total: 0 },
      yearly: { quantidade: 0, total: 0 }
    };

    const assinaturasContabilizadas = [];
    let totalFaturado = 0;

    for (const user of assinaturasParaContabilizar) {
      const plano = user.subscription.plan;
      const valor = user.subscription.lastPaymentAmount;

      if (breakdown[plano]) {
        breakdown[plano].quantidade += 1;
        breakdown[plano].total += valor;
        totalFaturado += valor;

        assinaturasContabilizadas.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          plano: plano,
          valor: valor,
          dataAssinatura: user.subscription.startDate
        });
      }
    }

    // Calcular impostos (6%)
    const impostos = totalFaturado * 0.06;
    const totalLiquido = totalFaturado - impostos;

    // Criar relatório contábil
    const relatorio = new RelatorioContabil({
      dataFechamento: dataFechamentoAtual,
      periodoInicio: inicioperiodoAtual,
      periodoFim: dataFechamentoAtual,
      breakdown,
      totalFaturado,
      impostos,
      totalLiquido,
      assinaturasContabilizadas,
      fechadoPor: session.user.id,
      fechadoPorNome: session.user.name
    });

    await relatorio.save();

    console.log(`Contabilidade fechada - Período: ${inicioperiodoAtual.toLocaleDateString()} até ${dataFechamentoAtual.toLocaleDateString()}:`, {
      totalAssinaturas: assinaturasParaContabilizar.length,
      totalFaturado,
      impostos,
      totalLiquido,
      breakdown
    });

    return NextResponse.json({
      success: true,
      relatorio: {
        periodoInicio: inicioperiodoAtual,
        periodoFim: dataFechamentoAtual,
        totalFaturado,
        impostos,
        totalLiquido,
        breakdown,
        totalAssinaturas: assinaturasParaContabilizar.length
      }
    });

  } catch (error) {
    console.error('Erro ao fechar contabilidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}