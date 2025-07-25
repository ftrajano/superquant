// lib/subscription.js
import User from './models/User';

// Planos disponíveis com duração
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 117.00,
    duration: 1, // meses
    description: 'Pagamento mensal flexível'
  },
  quarterly: {
    id: 'quarterly', 
    name: 'Plano Trimestral',
    price: 329.00,
    duration: 3, // meses
    description: 'Economize 6% com o plano trimestral'
  },
  yearly: {
    id: 'yearly',
    name: 'Plano Anual', 
    price: 1297.00,
    duration: 12, // meses
    description: 'Economize 7% com o plano anual'
  }
};

// Verificar se usuário tem assinatura ativa
export async function hasActiveSubscription(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.subscription) return false;

    const { status, expirationDate } = user.subscription;
    
    // Verificar se status é ativo e não expirou
    if (status !== 'active') return false;
    if (!expirationDate) return false;
    
    return new Date() < new Date(expirationDate);
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}

// Ativar assinatura do usuário
export async function activateSubscription(userId, planId, paymentData = {}) {
  try {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error('Plano não encontrado');

    const startDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + plan.duration);

    const updateData = {
      'subscription.plan': planId,
      'subscription.status': 'active',
      'subscription.startDate': startDate,
      'subscription.expirationDate': expirationDate,
      'subscription.lastPaymentAmount': plan.price,
      'subscription.lastPaymentDate': startDate
    };

    // Adicionar dados do pagamento se fornecidos
    if (paymentData.mercadoPagoPaymentId) {
      updateData['subscription.mercadoPagoPaymentId'] = paymentData.mercadoPagoPaymentId;
    }
    if (paymentData.mercadoPagoPreferenceId) {
      updateData['subscription.mercadoPagoPreferenceId'] = paymentData.mercadoPagoPreferenceId;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    console.log('Assinatura ativada:', {
      userId,
      planId,
      startDate,
      expirationDate,
      paymentId: paymentData.mercadoPagoPaymentId
    });

    return user;
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    throw error;
  }
}

// Desativar assinatura
export async function deactivateSubscription(userId, reason = 'cancelled') {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'subscription.status': reason, // 'cancelled', 'expired', etc.
        'subscription.autoRenew': false
      },
      { new: true }
    );

    console.log('Assinatura desativada:', { userId, reason });
    return user;
  } catch (error) {
    console.error('Erro ao desativar assinatura:', error);
    throw error;
  }
}

// Verificar se assinatura está próxima do vencimento
export async function isSubscriptionExpiring(userId, daysThreshold = 7) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.subscription?.expirationDate) return false;

    const expirationDate = new Date(user.subscription.expirationDate);
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= daysThreshold && diffDays > 0;
  } catch (error) {
    console.error('Erro ao verificar vencimento:', error);
    return false;
  }
}

// Obter informações da assinatura do usuário
export async function getSubscriptionInfo(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const subscription = user.subscription;
    const plan = subscription?.plan ? SUBSCRIPTION_PLANS[subscription.plan] : null;

    return {
      ...subscription?.toObject(),
      planDetails: plan,
      isActive: await hasActiveSubscription(userId),
      isExpiring: await isSubscriptionExpiring(userId)
    };
  } catch (error) {
    console.error('Erro ao obter info da assinatura:', error);
    return null;
  }
}