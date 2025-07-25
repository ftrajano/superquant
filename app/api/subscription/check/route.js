// app/api/subscription/check/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { hasActiveSubscription, getSubscriptionInfo } from '../../../../lib/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Não autenticado',
          hasActiveSubscription: false,
          requiresAuth: true 
        },
        { status: 401 }
      );
    }

    // Administradores têm acesso total
    if (session.user.role === 'admin') {
      return NextResponse.json({
        hasActiveSubscription: true,
        isAdmin: true,
        subscription: null
      });
    }

    // Verificar assinatura
    const hasSubscription = await hasActiveSubscription(session.user.id);
    const subscriptionInfo = await getSubscriptionInfo(session.user.id);

    return NextResponse.json({
      hasActiveSubscription: hasSubscription,
      subscription: subscriptionInfo,
      requiresSubscription: !hasSubscription
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        hasActiveSubscription: false 
      },
      { status: 500 }
    );
  }
}