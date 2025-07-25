// lib/middleware/subscription.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth';
import { hasActiveSubscription } from '../subscription';
import { NextResponse } from 'next/server';

// Middleware para verificar assinatura ativa
export async function requireActiveSubscription(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado', requiresAuth: true },
        { status: 401 }
      );
    }

    // Administradores têm acesso total
    if (session.user.role === 'admin') {
      return null; // Permitir acesso
    }

    // Verificar assinatura ativa
    const hasSubscription = await hasActiveSubscription(session.user.id);
    
    if (!hasSubscription) {
      return NextResponse.json(
        { 
          error: 'Assinatura necessária', 
          requiresSubscription: true,
          redirectTo: '/assinatura'
        },
        { status: 403 }
      );
    }

    return null; // Permitir acesso
  } catch (error) {
    console.error('Erro no middleware de assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Hook para usar em componentes React (lado cliente)
export function useSubscriptionCheck() {
  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/check');
      const data = await response.json();
      
      if (!response.ok) {
        if (data.requiresSubscription) {
          window.location.href = '/assinatura';
          return false;
        }
        if (data.requiresAuth) {
          window.location.href = '/login';
          return false;
        }
        throw new Error(data.error);
      }
      
      return data.hasActiveSubscription;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return false;
    }
  };

  return { checkSubscription };
}