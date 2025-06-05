'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('confirming'); // confirming, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token de confirmação não encontrado.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await fetch(`/api/auth/confirm-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email confirmado com sucesso!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao confirmar email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erro ao confirmar email. Tente novamente.');
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-[var(--surface-card)] p-8 rounded-lg shadow-md">
          <div className="text-center">
            {status === 'confirming' && (
              <>
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Confirmando seu email...
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Aguarde enquanto confirmamos sua conta.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Email Confirmado!
                </h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="btn btn-primary block w-full text-center py-2 px-4 rounded transition-colors"
                  >
                    Fazer Login
                  </Link>
                  <Link
                    href="/"
                    className="block w-full border border-[var(--surface-border)] py-2 px-4 rounded hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    Voltar ao Início
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Erro na Confirmação
                </h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/cadastro"
                    className="block w-full bg-[var(--primary)] text-white py-2 px-4 rounded hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    Cadastrar Novamente
                  </Link>
                  <Link
                    href="/"
                    className="block w-full border border-[var(--surface-border)] py-2 px-4 rounded hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    Voltar ao Início
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}