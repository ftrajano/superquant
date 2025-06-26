'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import UserAutocomplete from '@/components/ui/UserAutocomplete';

export default function CarteirasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

        <div className="text-center py-12">
          <div className="text-text-secondary">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg">Use o campo de busca para encontrar um usuário</p>
            <p className="text-sm mt-2">Digite o nome ou email para visualizar as operações</p>
          </div>
        </div>
      </div>
    </div>
  );
}