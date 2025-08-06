import { NextResponse } from 'next/server';
import { getPaymentStatus } from '../../../../lib/mercadopago';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';
import { activateSubscription, SUBSCRIPTION_PLANS } from '../../../../lib/subscription';

export async function POST(request) {
  try {
    // Verificar se é um webhook válido do MercadoPago
    const body = await request.json();
    console.log('Webhook recebido:', body);

    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      return NextResponse.json({ message: 'Tipo de notificação não processado' });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento não fornecido' }, { status: 400 });
    }

    // Buscar detalhes do pagamento no MercadoPago
    const paymentData = await getPaymentStatus(paymentId);
    console.log('Dados do pagamento:', paymentData);

    // Processar apenas pagamentos aprovados
    if (paymentData.status === 'approved') {
      await processApprovedPayment(paymentData);
    }

    return NextResponse.json({ message: 'Webhook processado com sucesso' });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function processApprovedPayment(paymentData) {
  try {
    await connectToDatabase();

    const payerEmail = paymentData.payer?.email;
    if (!payerEmail) {
      console.error('Email do pagador não encontrado');
      return;
    }

    // Para ambiente de teste, usar o email real do usuário logado
    let searchEmail = payerEmail;
    if (payerEmail === 'test@testuser.com') {
      // Em ambiente de teste, tentar encontrar pelo preference_id ou outras formas
      console.log('Email de teste detectado, tentando encontrar usuário real...');
      // Por enquanto, vamos pular a validação em ambiente de teste
      return;
    }

    // Buscar usuário pelo email
    const user = await User.findOne({ email: searchEmail });
    if (!user) {
      console.error('Usuário não encontrado:', searchEmail);
      return;
    }

    // Determinar o plano baseado no valor pago
    const amount = paymentData.transaction_amount;
    let planId = 'monthly';
    
    // Encontrar plano correspondente ao valor
    for (const [id, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (Math.abs(amount - plan.price) < 0.01) { // Tolerância para centavos
        planId = id;
        break;
      }
    }

    // Verificar se já foi processado (evitar dupla ativação)
    const existingUser = await User.findOne({ 
      'subscription.mercadoPagoPaymentId': paymentData.id 
    });
    
    if (existingUser) {
      console.log('Pagamento já processado anteriormente:', paymentData.id);
      return;
    }

    // Ativar assinatura usando a função utilitária - CHAMADA INTERNA SEGURA
    await activateSubscription(user._id, planId, {
      mercadoPagoPaymentId: paymentData.id,
      mercadoPagoPreferenceId: paymentData.additional_info?.external_reference,
      isWebhookInternal: true // FLAG PARA IDENTIFICAR CHAMADA SEGURA
    });

    console.log('Assinatura ativada via webhook para usuário:', user.email);

    // TODO: Enviar email de confirmação
    // TODO: Notificar via Telegram se necessário

  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ message: 'Método não permitido' }, { status: 405 });
}