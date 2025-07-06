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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-bg)' }}>
      {/* Header/Barra superior */}
      <div className="w-full py-6" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              SuperQuant
            </Link>
            <Link 
              href="/cadastro"
              className="text-sm font-medium px-4 py-2 rounded-md border transition-colors"
              style={{ 
                color: 'var(--primary)', 
                borderColor: 'var(--primary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-bg)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg p-6 shadow-lg border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Bem-vindo(a) de volta</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Entre com sua conta para continuar</p>
          </div>

          {error && (
            <div className="rounded-md p-4 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: 'var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: 'var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    color: 'var(--text-primary)'
                  }}
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

          <div className="mt-4 text-center text-sm space-y-2">
            <p style={{ color: 'var(--text-secondary)' }}>
              <Link href="/forgot-password" className="font-medium" style={{ color: 'var(--primary)' }}>
                Esqueci minha senha
              </Link>
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="font-medium" style={{ color: 'var(--primary)' }}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}