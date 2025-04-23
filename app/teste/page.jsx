'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';

export default function TestePage() {
  const { data: session, status } = useSession();
  const [authCheck, setAuthCheck] = useState(null);
  const [operacoesData, setOperacoesData] = useState(null);
  const [testOpResult, setTestOpResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Verificar a autenticação via API
  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();
      setAuthCheck(data);
    } catch (error) {
      setAuthCheck({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar operações
  const checkOperacoes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operacoes?mes=abril&ano=2025');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setOperacoesData(data);
    } catch (error) {
      setOperacoesData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  // Criar operação de teste
  const createTestOperacao = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-test-op');
      const data = await response.json();
      setTestOpResult(data);
      // Após criar a operação, atualizar a lista
      checkOperacoes();
    } catch (error) {
      setTestOpResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar dados da sessão no cliente
  useEffect(() => {
    console.log('Status de autenticação:', status);
    console.log('Dados da sessão:', session);
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">Página de Teste</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Dados da Sessão (Cliente)</h2>
          
          <div className="mb-4">
            <p className="mb-2"><strong>Status:</strong> {status}</p>
            {session && (
              <div>
                <p><strong>Usuário:</strong> {session.user?.name}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>ID:</strong> {session.user?.id}</p>
                <p><strong>Papel:</strong> {session.user?.role}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={checkAuth}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Verificar Auth
            </button>
            
            <button
              onClick={checkOperacoes}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Verificar Operações
            </button>
            
            <button
              onClick={createTestOperacao}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Criar Op. Teste
            </button>
          </div>
        </div>
        
        {authCheck && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Verificação de Autenticação (Servidor)</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-80 text-sm">
              {JSON.stringify(authCheck, null, 2)}
            </pre>
          </div>
        )}
        
        {testOpResult && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Resultado da Operação de Teste</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-80 text-sm">
              {JSON.stringify(testOpResult, null, 2)}
            </pre>
          </div>
        )}
        
        {operacoesData && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Operações API</h2>
            <div className="mb-2">
              <strong>Total de operações:</strong> {operacoesData.operacoes?.length || 0}
            </div>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-80 text-sm">
              {JSON.stringify(operacoesData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}