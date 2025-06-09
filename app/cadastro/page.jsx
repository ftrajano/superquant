'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Registro do usuário
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      // Sucesso no cadastro
      setSuccess(true);
      
      // Redirecionar para página inicial após 20 segundos
      setTimeout(() => {
        router.push('/');
      }, 20000);
    } catch (error) {
      setError(error.message);
      console.error('Erro no cadastro:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-bg dark:bg-surface-bg">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface-card dark:bg-surface-card p-6 shadow-md border border-surface-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary">Crie sua conta</h1>
          <p className="mt-2 text-text-secondary dark:text-text-secondary">Cadastre-se para começar a usar</p>
        </div>

        {error && (
          <div className="rounded-md bg-error/10 p-4 text-sm text-error dark:text-error">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Conta criada com sucesso!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Enviamos um email de confirmação para <strong>{email}</strong>.
                  </p>
                  <p className="mt-1">
                    <strong>Importante:</strong> Você precisa confirmar seu email antes de fazer login.
                  </p>
                  <p className="mt-1">
                    Verifique sua caixa de entrada e clique no link de confirmação.
                  </p>
                  <p className="mt-2 text-xs">
                    Redirecionando para a página inicial em 20 segundos...
                  </p>
                  <div className="mt-3">
                    <Link 
                      href="/login"
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-100 hover:bg-green-200 rounded border border-green-300 transition-colors"
                    >
                      Ir para Login agora
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!success && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary dark:text-text-secondary">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-surface-border bg-surface-bg dark:bg-surface-bg dark:text-text-primary px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                placeholder="Seu nome"
              />
            </div>
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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
        )}

        {!success && (
        <div className="mt-4 text-center text-sm">
          <p className="text-text-secondary dark:text-text-secondary">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Faça login
            </Link>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}