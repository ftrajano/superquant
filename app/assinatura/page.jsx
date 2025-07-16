'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';

const plans = {
  monthly: {
    id: 'monthly',
    name: 'Plano Mensal',
    description: 'Pagamento mensal flexível',
    price: 117.00,
    currency: 'BRL',
    duration: '1 mês',
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
    originalPrice: 351.00,
    currency: 'BRL',
    duration: '3 meses',
    popular: true,
    savings: 22,
    savingsPercent: 6,
    features: [
      'Acesso ao SuperQuant.IA',
      'Análise quantitativa completa',
      'Alerts em tempo real',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de acesso aos dados',
      'Estratégias personalizadas',
      '💰 Economia de R$ 22'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Plano Anual',
    description: 'Economize 7% com o plano anual',
    price: 1297.00,
    originalPrice: 1404.00,
    currency: 'BRL',
    duration: '12 meses',
    popular: false,
    savings: 107,
    savingsPercent: 7,
    features: [
      'Acesso ao SuperQuant.IA',
      'Análise quantitativa completa',
      'Alerts em tempo real',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de acesso aos dados',
      'Estratégias personalizadas',
      '💰 Economia de R$ 107'
    ]
  }
};

export default function AssinaturaPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCloseCheckout = () => {
    setSelectedPlan(null);
  };

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)]">
        <NavBar />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="mb-6">
            <button
              onClick={handleCloseCheckout}
              className="flex items-center text-[var(--primary)] hover:text-[var(--primary-hover)] mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar aos planos
            </button>
          </div>
          <MercadoPagoCheckout 
            plan={selectedPlan}
            onSuccess={() => console.log('Pagamento bem-sucedido')}
            onError={(error) => console.error('Erro no pagamento:', error)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            Acesse a inteligência artificial do SuperQuant e opere opções com dados que antes só profissionais tinham acesso.
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Object.values(plans).map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-[var(--surface-card)] rounded-2xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-[var(--primary)] scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  {plan.name}
                </h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  {plan.description}
                </p>
                <div className="text-4xl font-bold text-[var(--primary)] mb-2">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-[var(--text-secondary)] text-sm">por {plan.duration}</p>
                {plan.savings && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 line-through">
                      R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-green-600 font-semibold">
                      Economize {plan.savingsPercent}%
                    </p>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-[var(--primary)] mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                    : 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-bg)]'
                }`}
              >
                Escolher {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="bg-[var(--surface-card)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Pagamento Seguro
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Processado via MercadoPago com máxima segurança
              </p>
            </div>
            
            <div>
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Múltiplas Formas
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                PIX, cartão de crédito, débito e boleto
              </p>
            </div>
            
            <div>
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Cancele Quando Quiser
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Sem fidelidade. Cancele a qualquer momento
              </p>
            </div>
          </div>
        </div>

        {/* Aviso educacional */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--warning)] text-white">
            <span className="text-sm font-medium">
              ⚠️ Conteúdo educacional - Não são recomendações de investimento
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}