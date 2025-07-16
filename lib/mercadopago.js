import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuração do cliente MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

// Instâncias dos serviços
export const preference = new Preference(client);
export const payment = new Payment(client);

// Configurações padrão
export const mercadoPagoConfig = {
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
};

// Função para criar preferência de pagamento
export async function createPreference(items, payer = null, backUrls = null) {
  try {
    const defaultBackUrls = {
      success: `${process.env.NEXTAUTH_URL}/pagamento/sucesso`,
      failure: `${process.env.NEXTAUTH_URL}/pagamento/erro`,
      pending: `${process.env.NEXTAUTH_URL}/pagamento/pendente`
    };

    const body = {
      items: items,
      back_urls: backUrls || defaultBackUrls,
      notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'SuperQuant',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };

    if (payer) {
      body.payer = payer;
    }

    const result = await preference.create({ body });
    return result;
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw error;
  }
}

// Função para verificar status do pagamento
export async function getPaymentStatus(paymentId) {
  try {
    const result = await payment.get({ id: paymentId });
    return result;
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    throw error;
  }
}

// Planos de assinatura disponíveis
export const subscriptionPlans = {
  monthly: {
    id: 'monthly',
    name: 'Plano Mensal',
    description: 'Acesso completo ao SuperQuant',
    price: 117.00,
    currency: 'BRL',
    duration: 1, // meses
    durationType: 'month',
    popular: false,
    savings: null,
    features: [
      'Acesso ao SuperQuant.IA',
      'Análise quantitativa completa',
      'Alerts em tempo real',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de acesso aos dados',
      'Estratégias personalizadas'
    ]
  },
  quarterly: {
    id: 'quarterly',
    name: 'Plano Trimestral',
    description: 'Economize 6% com o plano trimestral',
    price: 329.00,
    currency: 'BRL',
    duration: 3, // meses
    durationType: 'month',
    popular: true,
    savings: 22, // R$ 351 - 329 = R$ 22
    savingsPercent: 6,
    features: [
      'Acesso ao SuperQuant.IA',
      'Análise quantitativa completa',
      'Alerts em tempo real',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de acesso aos dados',
      'Estratégias personalizadas',
      'Economia de R$ 22'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Plano Anual',
    description: 'Economize 7% com o plano anual',
    price: 1297.00,
    currency: 'BRL',
    duration: 12, // meses
    durationType: 'month',
    popular: false,
    savings: 107, // R$ 1404 - 1297 = R$ 107
    savingsPercent: 7,
    features: [
      'Acesso ao SuperQuant.IA',
      'Análise quantitativa completa',
      'Alerts em tempo real',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de acesso aos dados',
      'Estratégias personalizadas',
      'Economia de R$ 107'
    ]
  }
};

export default client;