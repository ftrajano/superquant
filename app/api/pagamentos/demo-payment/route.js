import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

// Esta é uma API de demonstração para testar o fluxo sem credenciais reais do MercadoPago
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { planId } = await request.json();

    // Planos de demonstração (iguais aos reais)
    const demoPlans = {
      test: { name: 'Teste - R$ 1,00', price: 1.00 },
      monthly: { name: 'Plano Mensal', price: 117.00 },
      quarterly: { name: 'Plano Trimestral', price: 329.00 },
      yearly: { name: 'Plano Anual', price: 1297.00 }
    };

    const plan = demoPlans[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    // Simular a criação de uma preferência do MercadoPago
    const mockPreferenceId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // URL de demonstração que simula o checkout do MercadoPago
    const demoCheckoutUrl = `${process.env.NEXTAUTH_URL}/pagamento/demo-checkout?preferenceId=${mockPreferenceId}&plan=${planId}`;

    console.log('Pagamento demo criado:', {
      userId: session.user.id,
      userEmail: session.user.email,
      planId: planId,
      preferenceId: mockPreferenceId,
      amount: plan.price
    });

    return NextResponse.json({
      success: true,
      preferenceId: mockPreferenceId,
      initPoint: demoCheckoutUrl,
      sandboxInitPoint: demoCheckoutUrl,
      plan: plan,
      isDemo: true
    });

  } catch (error) {
    console.error('Erro ao criar pagamento demo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}