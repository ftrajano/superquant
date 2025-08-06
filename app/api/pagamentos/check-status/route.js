// app/api/pagamentos/check-status/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { getPaymentStatus } from '../../../../lib/mercadopago';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    try {
      // VALIDAÇÃO CRÍTICA: Verificar o pagamento específico no MercadoPago
      const paymentInfo = await getPaymentStatus(paymentId);

      if (!paymentInfo) {
        return NextResponse.json({
          paymentStatus: 'not_found',
          isValidPayment: false,
          error: 'Pagamento não encontrado'
        });
      }

      // Verificar se o email do pagamento corresponde ao usuário logado
      const payerEmail = paymentInfo.payer?.email?.toLowerCase();
      const userEmail = session.user.email?.toLowerCase();

      if (payerEmail !== userEmail) {
        console.warn('Tentativa de validação com email diferente:', { payerEmail, userEmail, paymentId });
        return NextResponse.json({
          paymentStatus: 'invalid',
          isValidPayment: false,
          error: 'Email do pagamento não corresponde ao usuário'
        });
      }

      // Retornar status real do MercadoPago
      return NextResponse.json({
        paymentStatus: paymentInfo.status, // 'approved', 'pending', 'rejected', etc.
        isValidPayment: paymentInfo.status === 'approved',
        paymentMethod: paymentInfo.payment_method_id,
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
        dateCreated: paymentInfo.date_created,
        dateApproved: paymentInfo.date_approved
      });

    } catch (error) {
      console.error('Erro ao consultar MercadoPago:', error);
      
      // Se há erro na API do MercadoPago, não assumir que está aprovado
      return NextResponse.json({
        paymentStatus: 'error',
        isValidPayment: false,
        error: 'Erro ao verificar pagamento no MercadoPago'
      });
    }

  } catch (error) {
    console.error('Erro interno ao verificar status:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        paymentStatus: 'error',
        isValidPayment: false 
      },
      { status: 500 }
    );
  }
}