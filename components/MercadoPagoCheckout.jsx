'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function MercadoPagoCheckout({ plan, onSuccess, onError }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    if (!session) {
      setError('Você precisa estar logado para fazer uma compra');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Criar pagamento real via MercadoPago
      const response = await fetch('/api/pagamentos/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      // Redirecionar para o MercadoPago
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('Link de pagamento não gerado');
      }

    } catch (error) {
      console.error('Erro no checkout:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {plan.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {plan.description}
        </p>
        <div className="text-3xl font-bold text-green-600 mb-4">
          R$ {plan.price.toFixed(2).replace('.', ',')}
          <span className="text-sm text-gray-500">/mês</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Funcionalidades incluídas:
        </h3>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !session}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
          loading || !session
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Processando...
          </div>
        ) : !session ? (
          'Faça login para continuar'
        ) : (
          'Pagar com MercadoPago'
        )}
      </button>

      {!session && (
        <p className="text-center text-sm text-gray-500 mt-3">
          <a href="/login" className="text-blue-600 hover:underline">
            Clique aqui para fazer login
          </a>
        </p>
      )}

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Pagamento seguro via MercadoPago</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Aceitamos PIX, cartão de crédito e débito
        </p>
      </div>
    </div>
  );
}