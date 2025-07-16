import { NextResponse } from 'next/server';
import { getPaymentStatus } from '../../../../lib/mercadopago';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';

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

    // Buscar usuário pelo email
    const user = await User.findOne({ email: payerEmail });
    if (!user) {
      console.error('Usuário não encontrado:', payerEmail);
      return;
    }

    // Determinar o plano baseado no valor pago
    let planType = 'monthly';
    let duration = 1; // meses
    const amount = paymentData.transaction_amount;
    
    if (amount >= 1297.00) {
      planType = 'yearly';
      duration = 12;
    } else if (amount >= 329.00) {
      planType = 'quarterly';
      duration = 3;
    } else if (amount >= 117.00) {
      planType = 'monthly';
      duration = 1;
    }

    // Calcular data de expiração baseada na duração do plano
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + duration);

    // Atualizar usuário com informações da assinatura
    await User.findByIdAndUpdate(user._id, {
      subscription: {
        plan: planType,
        status: 'active',
        startDate: new Date(),
        expirationDate: expirationDate,
        mercadoPagoPaymentId: paymentData.id,
        lastPaymentAmount: amount,
        lastPaymentDate: new Date()
      },
      updatedAt: new Date()
    });

    // Log do processamento
    console.log('Assinatura ativada:', {
      userId: user._id,
      userEmail: payerEmail,
      plan: planType,
      paymentId: paymentData.id,
      amount: amount,
      expirationDate: expirationDate
    });

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