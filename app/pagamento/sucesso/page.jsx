'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);

// Componente que usa useSearchParams
const PagamentoSucessoContent = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);

  const planId = searchParams.get('plan');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    // Simular informações do pagamento baseado no plano
    if (planId) {
      const planNames = {
        basic: 'Plano Básico',
        premium: 'Plano Premium', 
        pro: 'Plano Profissional'
      };

      const planPrices = {
        basic: 29.90,
        premium: 59.90,
        pro: 99.90
      };

      setPaymentInfo({
        planName: planNames[planId] || 'Plano Desconhecido',
        planPrice: planPrices[planId] || 0,
        paymentId: paymentId
      });
    }
  }, [planId, paymentId]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface-card)] rounded-lg shadow-lg p-8 text-center">
          {/* Ícone de sucesso */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Pagamento Realizado com Sucesso!
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-6">
            Sua assinatura foi ativada e você já pode aproveitar todos os recursos do SuperQuant.
          </p>

          {paymentInfo && (
            <div className="bg-[var(--surface-bg)] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Detalhes da Compra
              </h2>
              <div className="space-y-2 text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-medium">{paymentInfo.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">R$ {paymentInfo.planPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {paymentInfo.paymentId && (
                  <div className="flex justify-between">
                    <span>ID do Pagamento:</span>
                    <span className="font-medium text-sm">{paymentInfo.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-green-600">Aprovado</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                🎉 Bem-vindo ao SuperQuant!
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Sua assinatura está ativa por 30 dias. Você receberá um email de confirmação 
                e poderá acessar todas as funcionalidades premium imediatamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ir para o Dashboard
              </Link>
              
              <Link
                href="/copytrading"
                className="inline-flex items-center px-6 py-3 border border-[var(--primary)] text-base font-medium rounded-md text-[var(--primary)] bg-transparent hover:bg-[var(--primary-bg)] transition-colors"
              >
                Explorar SuperQuant.IA
              </Link>
            </div>
          </div>

          <div className="mt-8 text-sm text-[var(--text-tertiary)]">
            <p>
              Dúvidas? Entre em contato conosco pelo email: 
              <a href="mailto:suporte@superquant.com" className="text-[var(--primary)] hover:underline ml-1">
                suporte@superquant.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function PagamentoSucesso() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <PagamentoSucessoContent />
    </Suspense>
  );
}