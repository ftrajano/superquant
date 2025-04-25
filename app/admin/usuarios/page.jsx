'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

export default function AdminUsuariosPage() {
  // Obter o tema atual
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Verificar se é administrador
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.replace('/');
      } else {
        fetchUsers();
      }
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session, router]);

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/usuarios');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      if (data.users && Array.isArray(data.users)) {
        console.log(`Recebidos ${data.users.length} usuários.`);
        setUsers(data.users);
      } else {
        console.error('Dados inválidos recebidos:', data);
        setUsers([]);
      }
    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Alterar papel do usuário
  const handleRoleChange = async (userId, newRole) => {
    try {
      setSuccess(null);
      setError(null);
      
      console.log(`Tentando alterar papel do usuário ${userId} para ${newRole}`);
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }
      
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      // Atualizar a lista localmente - certifique-se de comparar strings
      setUsers(users.map(user => 
        user._id.toString() === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)]">
        <NavBar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary)' }}>Gerenciar Usuários</h1>
          <p className="text-[var(--text-secondary)] mt-2">Gerencie permissões dos usuários do sistema</p>
        </div>

        {success && (
          <div className="mb-6 bg-success-bg border border-success text-success-dark px-4 py-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-error-bg border border-error text-error-dark px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <div className="bg-[var(--surface-card)] shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[var(--surface-border)]">
              <thead className="bg-primary-bg/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary-dark)' }}>
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary-dark)' }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary-dark)' }}>
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary-dark)' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--surface-card)] divide-y divide-[var(--surface-border)]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-[var(--text-secondary)]">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-primary-bg' 
                              : user.role === 'modelo' 
                                ? 'bg-success-bg' 
                                : 'bg-info-bg'
                          }`}
                          style={{ 
                            color: theme === 'dark' ? '#49db0f' : 
                              user.role === 'admin' ? 'var(--primary)' : 
                              user.role === 'modelo' ? 'var(--success)' : 
                              'var(--info)' 
                          }}>
                          {user.role === 'admin' 
                            ? 'Administrador' 
                            : user.role === 'modelo' 
                              ? 'Usuário Modelo' 
                              : 'Usuário Comum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.role !== 'admin' && (
                          <div className="flex space-x-2">
                            {user.role === 'user' ? (
                              <button
                                onClick={() => {
                                  console.log('Clicou em promover', user);
                                  handleRoleChange(user._id.toString(), 'modelo');
                                }}
                                style={{ color: theme === 'dark' ? '#49db0f' : 'var(--success)' }}
                              >
                                Promover para Modelo
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  console.log('Clicou em remover modelo', user);
                                  handleRoleChange(user._id.toString(), 'user');
                                }}
                                style={{ color: theme === 'dark' ? '#49db0f' : 'var(--info)' }}
                              >
                                Remover Modelo
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}