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
const PagamentoErroContent = () => {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState(null);

  const planId = searchParams.get('plan');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (planId) {
      const planNames = {
        basic: 'Plano Básico',
        premium: 'Plano Premium', 
        pro: 'Plano Profissional'
      };

      setErrorInfo({
        planName: planNames[planId] || 'Plano Desconhecido',
        paymentId: paymentId,
        status: status
      });
    }
  }, [planId, paymentId, status]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface-card)] rounded-lg shadow-lg p-8 text-center">
          {/* Ícone de erro */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Ops! Algo deu errado
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-6">
            Não foi possível processar seu pagamento. Mas não se preocupe, você pode tentar novamente.
          </p>

          {errorInfo && (
            <div className="bg-[var(--surface-bg)] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Detalhes da Tentativa
              </h2>
              <div className="space-y-2 text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-medium">{errorInfo.planName}</span>
                </div>
                {errorInfo.paymentId && (
                  <div className="flex justify-between">
                    <span>ID da Tentativa:</span>
                    <span className="font-medium text-sm">{errorInfo.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-red-600">Falhou</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                💡 Possíveis causas:
              </h3>
              <ul className="text-sm text-[var(--text-secondary)] text-left space-y-1">
                <li>• Saldo insuficiente no cartão ou conta</li>
                <li>• Dados do cartão incorretos</li>
                <li>• Limite de cartão excedido</li>
                <li>• Problemas temporários no processamento</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/assinatura"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                Tentar Novamente
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-[var(--primary)] text-base font-medium rounded-md text-[var(--primary)] bg-transparent hover:bg-[var(--primary-bg)] transition-colors"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>

          <div className="mt-8 text-sm text-[var(--text-tertiary)]">
            <p>
              Precisa de ajuda? Entre em contato conosco: 
              <a href="mailto:suporte@superquant.com" className="text-[var(--primary)] hover:underline ml-1">
                suporte@superquant.com
              </a>
            </p>
            <p className="mt-2">
              Ou pelo WhatsApp: 
              <a href="https://wa.me/5511999999999" className="text-[var(--primary)] hover:underline ml-1">
                (11) 99999-9999
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function PagamentoErro() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <PagamentoErroContent />
    </Suspense>
  );
}