'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Componente de carregamento
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
    <p className="text-text-secondary">Carregando...</p>
  </div>
);

// Componente principal com useSearchParams
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Token de redefinição inválido ou expirado');
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Erro ao redefinir senha');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  if (!token && !error) {
    return <LoadingUI />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg dark:bg-surface-tonal py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary dark:text-text-primary">
            Redefinir senha
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary">
            Digite sua nova senha
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-error/10 border border-error/20 p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-success/10 border border-success/20 p-4">
              <p className="text-sm text-success">{message}</p>
            </div>
          )}

          {token && !message && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-text-primary">
                  Nova senha
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-surface-border bg-surface-bg dark:bg-surface-bg dark:text-text-primary px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">Mínimo de 6 caracteres</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary dark:text-text-primary">
                  Confirmar nova senha
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-surface-border bg-surface-bg dark:bg-surface-bg dark:text-text-primary px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary group relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-4 text-center text-sm">
          <p className="text-text-secondary dark:text-text-secondary">
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente wrapper com Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <ResetPasswordContent />
    </Suspense>
  );
}