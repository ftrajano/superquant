'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function CarteirasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Buscar lista de usuários
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch('/api/usuarios');
        if (!response.ok) {
          throw new Error('Erro ao carregar usuários');
        }
        const data = await response.json();
        setUsuarios(data.usuarios);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'modelo' || session?.user?.role === 'admin') {
      fetchUsuarios();
    }
  }, [session]);

  const handleUsuarioChange = (event) => {
    const userId = event.target.value;
    setUsuarioSelecionado(userId);
    
    if (userId) {
      // Redirecionar para a página de operações com filtro de usuário
      router.push(`/carteiras/${userId}`);
    }
  };

  if (status === 'loading' || isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-500">Erro: {error}</p>
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
          <label htmlFor="usuario-select" className="block text-sm font-medium text-text-primary mb-2">
            Selecionar Usuário:
          </label>
          <select
            id="usuario-select"
            value={usuarioSelecionado}
            onChange={handleUsuarioChange}
            className="block w-full max-w-md px-3 py-2 border border-surface-border rounded-md shadow-sm bg-surface-card text-text-primary focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">-- Selecione um usuário --</option>
            {usuarios.map((usuario) => (
              <option key={usuario._id} value={usuario._id}>
                {usuario.name} ({usuario.email})
              </option>
            ))}
          </select>
        </div>

        {!usuarioSelecionado && (
          <div className="text-center py-12">
            <div className="text-text-secondary">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg">Selecione um usuário para visualizar suas operações</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}