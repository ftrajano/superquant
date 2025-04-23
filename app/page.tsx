'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário não estiver autenticado, deixamos na página inicial
    // Se estiver autenticado, mostramos o dashboard
  }, [status, router]);

  // Para usuários não autenticados, mostramos a landing page
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {status === 'authenticated' ? (
          // Dashboard para usuários logados
          <div className="space-y-10">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo(a), {session?.user?.name}!
              </h1>
              <p className="mt-2 text-gray-600">
                Escolha uma seção para começar:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <Link href="/operacoes" className="block bg-white overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-blue-600">Minhas Operações</h3>
                  <p className="mt-2 text-gray-600">
                    Gerencie suas próprias operações de opções
                  </p>
                  <div className="mt-4 text-sm font-medium text-blue-600">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/copytrading" className="block bg-white overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-green-600">CopyTrading</h3>
                  <p className="mt-2 text-gray-600">
                    Acesse operações modelo para se inspirar
                  </p>
                  <div className="mt-4 text-sm font-medium text-green-600">
                    Acessar →
                  </div>
                </div>
              </Link>

              <Link href="/relatorios" className="block bg-white overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-purple-600">Relatórios</h3>
                  <p className="mt-2 text-gray-600">
                    Veja estatísticas e resultados das suas operações
                  </p>
                  <div className="mt-4 text-sm font-medium text-purple-600">
                    Acessar →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          // Landing page para usuários não autenticados
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Superquant
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Plataforma completa para análise quantitativa e gerenciamento de operações.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link 
                href="/login" 
                className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Criar Conta
              </Link>
            </div>
            
            <div className="mt-16 bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Principais Funcionalidades</h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium text-gray-900">Registro de Operações</h3>
                  <p className="mt-2 text-gray-600">Registre compras e vendas de opções com todos os detalhes necessários.</p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium text-gray-900">CopyTrading</h3>
                  <p className="mt-2 text-gray-600">Acesse operações modelo e inspire-se para suas próprias estratégias.</p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium text-gray-900">Relatórios Detalhados</h3>
                  <p className="mt-2 text-gray-600">Acompanhe resultados e desempenho através de relatórios detalhados.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}