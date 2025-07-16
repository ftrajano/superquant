import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { createPreference, subscriptionPlans } from '../../../../lib/mercadopago';

export async function POST(request) {
  try {
    // Verificar credenciais do Mercado Pago
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN === 'your_access_token_here') {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json({ 
        error: 'Serviço de pagamento não configurado. Entre em contato com o suporte.' 
      }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { planId } = await request.json();

    // Verificar se o plano existe
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    // Criar item do MercadoPago
    const items = [
      {
        id: plan.id,
        title: plan.name,
        description: plan.description,
        unit_price: plan.price,
        quantity: 1,
        currency_id: plan.currency
      }
    ];

    // Dados do pagador
    const payer = {
      name: session.user.name,
      email: session.user.email
    };

    // URLs de retorno personalizadas
    const backUrls = {
      success: `${process.env.NEXTAUTH_URL}/pagamento/sucesso?plan=${planId}`,
      failure: `${process.env.NEXTAUTH_URL}/pagamento/erro?plan=${planId}`,
      pending: `${process.env.NEXTAUTH_URL}/pagamento/pendente?plan=${planId}`
    };

    // Criar preferência
    const preference = await createPreference(items, payer, backUrls);

    // Log da transação
    console.log('Preferência criada:', {
      userId: session.user.id,
      userEmail: session.user.email,
      planId: planId,
      preferenceId: preference.id,
      amount: plan.price
    });

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      plan: plan
    });

  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}