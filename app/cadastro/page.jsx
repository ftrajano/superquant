'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar consentimento
    if (!consentimento) {
      setError('Você deve concordar com os termos para prosseguir com o cadastro.');
      setLoading(false);
      return;
    }

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-bg)' }}>
      {/* Header/Barra superior */}
      <div className="w-full py-6" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              SuperQuant
            </Link>
            <Link 
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-md border transition-colors"
              style={{ 
                color: 'var(--primary)', 
                borderColor: 'var(--primary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-bg)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg p-6 shadow-lg border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Crie sua conta</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Cadastre-se para começar a usar</p>
          </div>

          {error && (
            <div className="rounded-md p-4 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border p-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" style={{ color: 'var(--success)' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                    Conta criada com sucesso!
                  </h3>
                  <div className="mt-2 text-sm" style={{ color: 'var(--success)' }}>
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
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded border transition-colors"
                        style={{ 
                          color: 'var(--success)',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          borderColor: 'var(--success)'
                        }}
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
                  <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: 'var(--surface-border)',
                      backgroundColor: 'var(--surface-bg)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Seu nome"
                  />
                </div>
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

              {/* Checkbox de consentimento */}
              <div className="flex items-start space-x-3">
                <input
                  id="consentimento"
                  name="consentimento"
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => setConsentimento(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border focus:ring-2"
                  style={{ 
                    borderColor: 'var(--surface-border)',
                    accentColor: 'var(--primary)'
                  }}
                />
                <label htmlFor="consentimento" className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Eu entendo que o <strong>SuperQuant é uma plataforma educacional</strong> e que todas as informações, análises e operações apresentadas têm <strong>fins exclusivamente educativos</strong>. 
                  Declaro estar ciente de que <strong>nenhum conteúdo constitui recomendação de investimento</strong> e que todas as decisões de investimento são de minha inteira responsabilidade.
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !consentimento}
                  className="btn btn-primary group relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </div>
            </form>
          )}

          {!success && (
            <div className="mt-4 text-center text-sm">
              <p style={{ color: 'var(--text-secondary)' }}>
                Já tem uma conta?{' '}
                <Link href="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
                  Faça login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}