'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Se o usuário não estiver autenticado, deixamos na página inicial
    // Se estiver autenticado, mostramos o dashboard
  }, [status, router]);

  // Para usuários não autenticados, mostramos a landing page
  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {status === 'authenticated' ? (
          // Dashboard para usuários logados
          <div className="space-y-10">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                Bem-vindo(a), {session?.user?.name}!
              </h1>
              <p className="mt-2 text-[var(--text-secondary)]">
                Escolha uma seção para começar:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Link href="/operacoes" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">Minhas Operações</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Gerencie suas próprias operações de opções
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/copytrading" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">SuperQuant.IA</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Acesse operações modelo geradas pelo bot para se inspirar
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/relatorios" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">Relatórios</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Veja estatísticas e resultados das suas operações
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>
              
              <Link href="/quant" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">Quant</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Análise quantitativa de opções com dados em tempo real
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/margem" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">Margem</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Calcule margens necessárias para suas operações
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/plano-trade" className="block bg-[var(--surface-card)] overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--primary)]">Plano de Trading</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Gerencie seus planos e estratégias de trading
                  </p>
                  <div className="mt-4 text-sm font-medium text-[var(--primary)]">
                    Acessar →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          // Landing page para usuários não autenticados
          <div>
            {/* Hero Section */}
            <div className="text-center mb-20">
              <h1 className="text-4xl font-extrabold text-[var(--foreground)] sm:text-5xl sm:tracking-tight lg:text-6xl mb-6">
                SuperQuant
              </h1>
              <h2 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl mb-6">
                Operar opções com inteligência artificial não é o futuro.<br />
                É o agora.
              </h2>
              
              <p className="mt-6 max-w-3xl mx-auto text-xl text-[var(--text-secondary)] leading-relaxed">
                <strong>Você ainda está analisando opções manualmente?</strong><br />
                Enquanto o mercado se move em segundos, a IA do SuperQuant já leu dezenas de ativos, 
                calculou probabilidades e identificou as oportunidades com maior chance de gerar renda.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/cadastro" 
                  className="px-8 py-4 text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: theme === 'dark' ? 'var(--color-dark-900)' : 'white'
                  }}
                >
                  Começar Agora
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 text-lg font-medium rounded-lg border-2 hover:bg-[var(--primary-bg)] transition-colors"
                  style={{
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)'
                  }}
                >
                  Já tenho conta
                </Link>
              </div>
            </div>

            {/* Seção de Monitoramento IA */}
            <div className="mb-20 bg-[var(--surface-card)] p-8 rounded-xl shadow-lg">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
                  Monitoramento Inteligente em Tempo Real
                </h2>
                <p className="text-lg text-[var(--text-secondary)] max-w-4xl mx-auto">
                  Nossa inteligência artificial faz a leitura em tempo real das opções de 
                  <strong> BOVA11, SMAL11 e IBOV</strong>, monitorando:
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Preços e Strikes</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Monitoramento contínuo de preços e strikes em tempo real</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Gregas</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Delta, Theta, Vega e outras métricas de risco</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Probabilidade de Lucro</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Cálculos estatísticos avançados de sucesso</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="text-3xl mb-3">🏦</div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Fluxo Institucional</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Movimentação de estrangeiros e instituições</p>
                </div>
              </div>
              
              <div className="text-center bg-[var(--primary-bg)] p-6 rounded-lg">
                <p className="text-lg font-medium text-[var(--primary)]">
                  <strong>O resultado?</strong> Alertas objetivos e dados filtrados em tempo real 
                  para apoiar sua tomada de decisão.
                </p>
              </div>
            </div>

            {/* Seção Diferencial */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
                  Você Continua no Controle. Agora com Superpoderes.
                </h2>
                <p className="text-lg text-[var(--text-secondary)] max-w-4xl mx-auto">
                  Os sinais do SuperQuant funcionam como um guia poderoso para sua análise: 
                  você continua no controle total da operação, mas agora com acesso a informações 
                  técnicas que antes estavam disponíveis apenas para profissionais institucionais.
                </p>
              </div>
            </div>
            
            {/* Funcionalidades */}
            <div className="bg-[var(--surface-card)] p-8 rounded-xl shadow-lg">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">Ferramentas Profissionais</h2>
                <p className="text-lg text-[var(--text-secondary)]">
                  Tudo que você precisa para operar opções com inteligência e precisão
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="text-center p-6 border border-[var(--surface-border)] rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">SuperQuant.IA</h3>
                  <p className="text-[var(--text-secondary)]">
                    Operações geradas por IA para inspirar suas estratégias. 
                    Aprenda com algoritmos que analisam o mercado 24/7.
                  </p>
                </div>
                
                <div className="text-center p-6 border border-[var(--surface-border)] rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Análise Quantitativa</h3>
                  <p className="text-[var(--text-secondary)]">
                    Black-Scholes, Gregas e probabilidades calculadas automaticamente. 
                    Dados que profissionais usam, agora na sua mão.
                  </p>
                </div>
                
                <div className="text-center p-6 border border-[var(--surface-border)] rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Gestão Inteligente</h3>
                  <p className="text-[var(--text-secondary)]">
                    Controle suas operações, calcule margens e acompanhe 
                    performance com relatórios detalhados.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <div className="inline-flex items-center px-6 py-3 rounded-lg" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
                  <span className="text-lg font-medium">
                    ⚠️ Conteúdo educacional - Não são recomendações de investimento
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}