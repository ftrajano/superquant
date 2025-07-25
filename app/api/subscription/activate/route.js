// app/api/subscription/activate/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { activateSubscription } from '../../../../lib/subscription';
import { getPaymentStatus } from '../../../../lib/mercadopago';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { planId, paymentData } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      );
    }

    // VALIDAR PAGAMENTO REAL - Apenas aceitar se vier de webhook interno ou com payment_id válido
    if (paymentData?.mercadoPagoPaymentId && !paymentData?.isWebhookInternal) {
      // Verificar se o pagamento existe e está aprovado no MercadoPago
      try {
        const paymentInfo = await getPaymentStatus(paymentData.mercadoPagoPaymentId);
        
        if (!paymentInfo || paymentInfo.status !== 'approved') {
          return NextResponse.json(
            { error: 'Pagamento não encontrado ou não aprovado' },
            { status: 400 }
          );
        }

        // Verificar se o email do pagamento corresponde ao usuário
        if (paymentInfo.payer?.email !== session.user.email) {
          return NextResponse.json(
            { error: 'Email do pagamento não corresponde ao usuário logado' },
            { status: 400 }
          );
        }

        // Verificar se já foi processado (evitar dupla ativação)
        if (paymentInfo.additional_info?.external_reference?.includes('processed')) {
          return NextResponse.json(
            { error: 'Pagamento já foi processado anteriormente' },
            { status: 400 }
          );
        }

      } catch (error) {
        console.error('Erro ao validar pagamento:', error);
        return NextResponse.json(
          { error: 'Erro ao validar pagamento no MercadoPago' },
          { status: 400 }
        );
      }
    } else if (!paymentData?.isWebhookInternal && !paymentData?.isEmergency) {
      // Se não tem payment_id e não é chamada interna, rejeitar
      return NextResponse.json(
        { error: 'Pagamento deve ser validado via MercadoPago' },
        { status: 400 }
      );
    }

    // Ativar assinatura apenas se passou na validação
    const user = await activateSubscription(session.user.id, planId, paymentData || {});

    return NextResponse.json({
      success: true,
      message: 'Assinatura ativada com sucesso',
      subscription: user.subscription
    });

  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}