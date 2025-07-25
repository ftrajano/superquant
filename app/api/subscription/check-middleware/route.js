// app/api/subscription/check-middleware/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ hasActiveSubscription: false });
    }

    await connectToDatabase();
    
    const user = await User.findById(userId).select('subscription email name');
    console.log('👤 API: Usuário encontrado:', user?.email, user?.name);
    console.log('📋 API: Subscription:', user?.subscription);
    
    if (!user || !user.subscription) {
      console.log('❌ API: Sem usuário ou subscription');
      return NextResponse.json({ hasActiveSubscription: false });
    }

    const { status, expirationDate } = user.subscription;
    console.log('🔍 API: Status:', status, 'Expira em:', expirationDate);
    
    // Verificar se status é ativo e não expirou
    if (status !== 'active') {
      console.log('❌ API: Status não é active:', status);
      return NextResponse.json({ hasActiveSubscription: false });
    }
    
    if (!expirationDate) {
      console.log('❌ API: Sem data de expiração');
      return NextResponse.json({ hasActiveSubscription: false });
    }
    
    const isValid = new Date() < new Date(expirationDate);
    console.log('✅ API: Assinatura válida?', isValid);
    
    return NextResponse.json({ 
      hasActiveSubscription: isValid,
      subscription: user.subscription,
      user: { email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('💥 API: Erro ao verificar assinatura:', error);
    return NextResponse.json({ hasActiveSubscription: false });
  }
}