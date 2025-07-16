'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);

// Componente que usa useSearchParams
const DemoCheckoutContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const preferenceId = searchParams.get('preferenceId');
  const planId = searchParams.get('plan');

  useEffect(() => {
    if (planId) {
      const planData = {
        basic: { name: 'Plano Básico', price: 29.90 },
        premium: { name: 'Plano Premium', price: 59.90 },
        pro: { name: 'Plano Profissional', price: 99.90 }
      };

      setPaymentInfo({
        ...planData[planId],
        preferenceId
      });
    }
  }, [planId, preferenceId]);

  const handlePaymentAction = (status) => {
    setProcessing(true);
    
    // Simular processamento do pagamento
    setTimeout(() => {
      const mockPaymentId = `demo_payment_${Date.now()}`;
      
      if (status === 'success') {
        router.push(`/pagamento/sucesso?plan=${planId}&payment_id=${mockPaymentId}&status=approved`);
      } else if (status === 'error') {
        router.push(`/pagamento/erro?plan=${planId}&payment_id=${mockPaymentId}&status=rejected`);
      } else {
        router.push(`/pagamento/pendente?plan=${planId}&payment_id=${mockPaymentId}&status=pending`);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface-card)] rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg inline-block mb-4">
              🎭 MODO DEMONSTRAÇÃO
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Checkout - MercadoPago
            </h1>
            <p className="text-[var(--text-secondary)]">
              Esta é uma simulação do checkout do MercadoPago
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-[var(--surface-bg)] rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Resumo do Pedido
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Produto:</span>
                  <span className="font-medium text-[var(--text-primary)]">{paymentInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Valor:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    R$ {paymentInfo.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-tertiary)]">ID da Preferência:</span>
                  <span className="text-[var(--text-tertiary)] font-mono text-xs">
                    {paymentInfo.preferenceId}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Simular Resultado do Pagamento:
            </h3>

            <button
              onClick={() => handlePaymentAction('success')}
              disabled={processing}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              ✅ Simular Pagamento Aprovado
            </button>

            <button
              onClick={() => handlePaymentAction('pending')}
              disabled={processing}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              ⏳ Simular Pagamento Pendente
            </button>

            <button
              onClick={() => handlePaymentAction('error')}
              disabled={processing}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              ❌ Simular Pagamento Rejeitado
            </button>

            {processing && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-[var(--text-secondary)]">Processando pagamento...</p>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ℹ️ Sobre esta demonstração:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Esta é uma simulação do fluxo de pagamento</li>
              <li>• Nenhum pagamento real será processado</li>
              <li>• Configure as credenciais reais do MercadoPago para produção</li>
              <li>• O webhook de confirmação também funcionará em modo demo</li>
            </ul>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/assinatura')}
              className="text-[var(--primary)] hover:underline"
            >
              ← Voltar aos planos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function DemoCheckout() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <DemoCheckoutContent />
    </Suspense>
  );
}