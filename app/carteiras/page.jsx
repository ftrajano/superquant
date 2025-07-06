'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import UserAutocomplete from '@/components/ui/UserAutocomplete';

export default function CarteirasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [letraSelecionada, setLetraSelecionada] = useState(null);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  // Verificar permissões
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'modelo' && session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleUserSelect = (usuario) => {
    // Redirecionar para a página de operações com filtro de usuário
    router.push(`/carteiras/${usuario._id}`);
  };

  // Função para buscar usuários por letra inicial
  const buscarUsuariosPorLetra = async (letra) => {
    setCarregandoUsuarios(true);
    setLetraSelecionada(letra);
    
    try {
      const response = await fetch(`/api/usuarios/buscar?q=${letra}&limit=50`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        throw new Error(`Erro ao buscar usuários: ${errorData.error || response.status}`);
      }
      
      const data = await response.json();
      // Filtrar usuários que começam com a letra selecionada
      const usuariosFiltrados = data.usuarios.filter(usuario => 
        usuario.name && usuario.name.toLowerCase().startsWith(letra.toLowerCase())
      );
      setUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsuarios([]);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  // Gerar letras do alfabeto
  const letrasAlfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Carteiras</h1>
          <p className="text-text-secondary">
            Selecione um usuário para visualizar suas operações
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Buscar Usuário:
          </label>
          <UserAutocomplete 
            onUserSelect={handleUserSelect}
            placeholder="Digite o nome ou email do usuário..."
          />
          <p className="text-xs text-text-secondary mt-2">
            Digite pelo menos 2 caracteres para começar a busca
          </p>
        </div>

        {/* Painel de letras A-Z */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Filtrar por letra inicial:</h2>
          <div className="flex flex-wrap gap-2">
            {letrasAlfabeto.map(letra => (
              <button
                key={letra}
                onClick={() => buscarUsuariosPorLetra(letra)}
                className={`w-10 h-10 rounded-md font-medium text-sm transition-colors ${
                  letraSelecionada === letra
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {letra}
              </button>
            ))}
            {letraSelecionada && (
              <button
                onClick={() => {
                  setLetraSelecionada(null);
                  setUsuarios([]);
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lista de usuários filtrados */}
        {letraSelecionada && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-text-primary mb-3">
              Usuários com nome iniciado em "{letraSelecionada}":
            </h3>
            
            {carregandoUsuarios ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-text-secondary">Carregando usuários...</p>
              </div>
            ) : usuarios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usuarios.map(usuario => (
                  <div
                    key={usuario._id}
                    onClick={() => handleUserSelect(usuario)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-text-primary">{usuario.name}</div>
                    <div className="text-sm text-text-secondary">{usuario.email}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-text-secondary">
                  Nenhum usuário encontrado com nome iniciado em "{letraSelecionada}"
                </p>
              </div>
            )}
          </div>
        )}

        {!letraSelecionada && (
          <div className="text-center py-12">
            <div className="text-text-secondary">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">Use o campo de busca ou selecione uma letra para encontrar usuários</p>
              <p className="text-sm mt-2">Digite o nome/email na busca ou clique em uma letra (A-Z) para filtrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}