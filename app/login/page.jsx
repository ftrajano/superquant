'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result.error) {
        setError('Email ou senha inválidos');
      } else {
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      setError('Ocorreu um erro ao fazer login');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-bg dark:bg-surface-bg">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface-card dark:bg-surface-card p-6 shadow-md border border-surface-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary">Bem-vindo(a) de volta</h1>
          <p className="mt-2 text-text-secondary dark:text-text-secondary">Entre com sua conta para continuar</p>
        </div>

        {error && (
          <div className="rounded-md bg-error/10 p-4 text-sm text-error dark:text-error">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary dark:text-text-secondary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-surface-border bg-surface-bg dark:bg-surface-bg dark:text-text-primary px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary dark:text-text-secondary">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm">
          <p className="text-text-secondary dark:text-text-secondary">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="font-medium text-primary hover:text-primary-hover">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}