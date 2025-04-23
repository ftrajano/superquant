'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';

export default function DiagnosticPage() {
  const [testResults, setTestResults] = useState(null);
  const [diagnosticoResults, setDiagnosticoResults] = useState(null);
  const [migrateResults, setMigrateResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [migrateType, setMigrateType] = useState('all');

  const handleTestConnection = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDiagnosticar = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/diagnose');
      const data = await response.json();
      setDiagnosticoResults(data);
    } catch (error) {
      setDiagnosticoResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMigrar = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/migrate?tipo=${migrateType}`);
      const data = await response.json();
      setMigrateResults(data);
    } catch (error) {
      setMigrateResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">Configuração e Diagnóstico</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Testar Conexão</h2>
            <p className="text-gray-600 mb-4">
              Testar a conexão com o MongoDB e operações básicas
            </p>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testando...' : 'Testar Conexão'}
            </button>
            
            {testResults && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h3 className="font-semibold">Resultado:</h3>
                <pre className="mt-2 text-sm bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Diagnosticar Banco de Dados</h2>
            <p className="text-gray-600 mb-4">
              Verificar consistência dos dados e identificar problemas
            </p>
            <button
              onClick={handleDiagnosticar}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Analisando...' : 'Diagnosticar Dados'}
            </button>
            
            {diagnosticoResults && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h3 className="font-semibold">Diagnóstico:</h3>
                <div className="mt-2 text-sm">
                  <p><strong>Total de Operações:</strong> {diagnosticoResults.resumo.totalOperacoes}</p>
                  <p><strong>Operações sem ID Visual:</strong> {diagnosticoResults.resumo.operacoesSemIdVisual}</p>
                  <p><strong>Operações sem Ticker:</strong> {diagnosticoResults.resumo.operacoesSemTicker}</p>
                  <p><strong>Operações sem Ano:</strong> {diagnosticoResults.resumo.operacoesSemAnoReferencia}</p>
                  <p><strong>Operações sem UserId:</strong> {diagnosticoResults.resumo.operacoesSemUserId}</p>
                </div>
                
                <div className="mt-4">
                  <details>
                    <summary className="cursor-pointer font-medium text-blue-600">
                      Ver detalhes completos
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                      {JSON.stringify(diagnosticoResults, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Migrar Dados</h2>
          <p className="text-gray-600 mb-4">
            Executar migrações para corrigir ou atualizar campos
          </p>
          
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={migrateType}
              onChange={(e) => setMigrateType(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">Todas as Migrações</option>
              <option value="idvisual">Apenas IDs Visuais</option>
              <option value="ticker">Apenas Tickers</option>
              <option value="ano">Apenas Anos</option>
              <option value="userId">Apenas UserIds</option>
            </select>
            
            <button
              onClick={handleMigrar}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Migrando...' : 'Executar Migração'}
            </button>
          </div>
          
          {migrateResults && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <h3 className="font-semibold">Resultado da Migração:</h3>
              <pre className="mt-2 text-sm bg-gray-100 p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(migrateResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}