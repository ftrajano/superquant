// app/page.tsx
import Link from 'next/link';

export default function Home() {
  // Landing page restaurada
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Superquant
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Plataforma completa para análise quantitativa e gerenciamento de operações.
          </p>
          <div className="mt-8 flex justify-center">
            <Link 
              href="/operacoes" 
              className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Módulo Opções
            </Link>
          </div>
        </div>
        
        <div className="mt-16 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Principais Funcionalidades</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Registro de Operações</h3>
              <p className="mt-2 text-gray-600">Registre compras e vendas de opções com todos os detalhes necessários.</p>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Visualização por Status</h3>
              <p className="mt-2 text-gray-600">Organize suas operações por mês de vencimento e status para melhor acompanhamento.</p>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Fechamento e Resultados</h3>
              <p className="mt-2 text-gray-600">Feche operações e acompanhe resultados de forma automatizada e intuitiva.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}