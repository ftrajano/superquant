'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Se o email estiver cadastrado, você receberá um link para redefinir sua senha.');
        setEmail('');
      } else {
        setError(data.error || 'Erro ao processar solicitação');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg dark:bg-surface-tonal py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary dark:text-text-primary">
            Esqueci minha senha
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary">
            Digite seu email para receber um link de redefinição de senha
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-text-primary">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-surface-border bg-surface-bg dark:bg-surface-bg dark:text-text-primary px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary group relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm">
          <p className="text-text-secondary dark:text-text-secondary">
            Lembrou da senha?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}