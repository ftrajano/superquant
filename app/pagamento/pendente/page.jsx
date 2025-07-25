'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
const PagamentoPendenteContent = () => {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const planId = searchParams.get('plan');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (planId) {
      const planNames = {
        monthly: 'Plano Mensal',
        quarterly: 'Plano Trimestral',
        yearly: 'Plano Anual'
      };

      const planPrices = {
        monthly: 117.00,
        quarterly: 329.00,
        yearly: 1297.00
      };

      setPaymentInfo({
        planName: planNames[planId] || 'Plano Desconhecido',
        planPrice: planPrices[planId] || 0,
        paymentId: paymentId
      });
    }
  }, [planId, paymentId]);

  // Verificar status do pagamento a cada 10 segundos
  useEffect(() => {
    if (!paymentId) return;

    const checkPaymentStatus = async () => {
      try {
        setCheckingPayment(true);
        const response = await fetch('/api/subscription/check', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.hasActiveSubscription) {
            setPaymentStatus('approved');
            // Redirecionar para página de sucesso após 2 segundos
            setTimeout(() => {
              window.location.href = `/pagamento/sucesso?plan=${planId}&payment_id=${paymentId}&status=approved`;
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Verificar imediatamente
    checkPaymentStatus();

    // Verificar a cada 10 segundos
    const interval = setInterval(checkPaymentStatus, 10000);

    return () => clearInterval(interval);
  }, [paymentId, planId]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface-card)] rounded-lg shadow-lg p-8 text-center">
          {/* Ícone de pendente */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            {paymentStatus === 'approved' ? 'Pagamento Aprovado!' : 'Pagamento em Processamento'}
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-6">
            {paymentStatus === 'approved' 
              ? 'Seu pagamento foi aprovado! Redirecionando...' 
              : 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.'}
          </p>

          {checkingPayment && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span className="text-sm text-[var(--text-secondary)]">Verificando pagamento...</span>
            </div>
          )}

          {paymentInfo && (
            <div className="bg-[var(--surface-bg)] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Detalhes do Pagamento
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
                  <span className={`font-medium ${paymentStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {paymentStatus === 'approved' ? 'Aprovado' : 'Em processamento'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                ⏳ O que acontece agora?
              </h3>
              <div className="text-sm text-[var(--text-secondary)] text-left space-y-2">
                <p>• Seu pagamento está sendo verificado pelo MercadoPago</p>
                <p>• Você receberá um email de confirmação quando aprovado</p>
                <p>• O acesso premium será liberado automaticamente</p>
                <p>• Este processo pode levar alguns minutos</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ir para o Dashboard
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-3 border border-[var(--primary)] text-base font-medium rounded-md text-[var(--primary)] bg-transparent hover:bg-[var(--primary-bg)] transition-colors"
              >
                Verificar Status
              </button>
            </div>
          </div>

          <div className="mt-8 text-sm text-[var(--text-tertiary)]">
            <p>
              Problemas com seu pagamento? 
              <a href="mailto:suporte@superquant.com" className="text-[var(--primary)] hover:underline ml-1">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function PagamentoPendente() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <PagamentoPendenteContent />
    </Suspense>
  );
}