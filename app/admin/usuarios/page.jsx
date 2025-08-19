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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Verificar se é administrador ou modelo
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.role !== 'modelo') {
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
  
  // Confirmar email do usuário
  const handleConfirmEmail = async (userId, userName) => {
    try {
      if (!confirm(`Confirmar email do usuário ${userName}?`)) {
        return;
      }
      
      setSuccess(null);
      setError(null);
      
      const response = await fetch('/api/admin/debug-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: users.find(u => u._id.toString() === userId)?.email,
          action: 'confirm_email' 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao confirmar email');
      }
      
      setSuccess(`Email de ${userName} confirmado com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Alterar senha do usuário
  const handleChangePassword = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        setError('Nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      
      setSuccess(null);
      setError(null);
      
      const response = await fetch(`/api/admin/usuarios/${selectedUser._id}/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao alterar senha');
      }
      
      setSuccess(`Senha de ${selectedUser.name} alterada com sucesso!`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Remover usuário
  const handleDeleteUser = async (userId, userName) => {
    try {
      if (!confirm(`Tem certeza que deseja remover o usuário ${userName}? ATENÇÃO: Todas as operações associadas a este usuário também serão removidas permanentemente. Esta ação não pode ser desfeita.`)) {
        return;
      }
      
      setSuccess(null);
      setError(null);
      
      console.log(`Tentando remover usuário ${userId}`);
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover usuário');
      }
      
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      // Remover o usuário da lista local
      setUsers(users.filter(user => user._id.toString() !== userId));
      
      setSuccess('Usuário removido com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'modelo')) {
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
                          <div className="flex flex-col space-y-2">
                            {/* Usuários modelo só podem gerenciar usuários comuns */}
                            {(session?.user?.role === 'admin' || user.role === 'user') && (
                              <>
                                {user.role === 'user' ? (
                                  <button
                                    onClick={() => {
                                      console.log('Clicou em promover', user);
                                      handleRoleChange(user._id.toString(), 'modelo');
                                    }}
                                    style={{ color: theme === 'dark' ? '#49db0f' : 'var(--success)' }}
                                    className="text-left"
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
                                    className="text-left"
                                  >
                                    Remover Modelo
                                  </button>
                                )}
                                
                                {/* Apenas admin pode alterar senhas */}
                                {session?.user?.role === 'admin' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowPasswordModal(true);
                                      }}
                                      style={{ color: theme === 'dark' ? '#49db0f' : 'var(--warning)' }}
                                      className="text-left"
                                    >
                                      Alterar Senha
                                    </button>
                                    
                                    <button
                                      onClick={() => handleConfirmEmail(user._id.toString(), user.name)}
                                      style={{ color: theme === 'dark' ? '#60a5fa' : 'var(--info)' }}
                                      className="text-left"
                                    >
                                      Confirmar Email
                                    </button>
                                  </>
                                )}
                                
                                <button
                                  onClick={() => handleDeleteUser(user._id.toString(), user.name)}
                                  style={{ color: theme === 'dark' ? '#fecaca' : '#dc2626' }}
                                  className="text-left"
                                >
                                  Remover Usuário
                                </button>
                              </>
                            )}
                            
                            {/* Mostrar mensagem para usuários que modelo não pode gerenciar */}
                            {session?.user?.role === 'modelo' && user.role !== 'user' && (
                              <span style={{ color: 'var(--text-secondary)' }} className="text-xs italic">
                                Sem permissão para alterar
                              </span>
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

        {/* Modal para alterar senha */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[var(--surface-card)] rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                Alterar Senha de {selectedUser?.name}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--surface-border)] rounded-md bg-[var(--surface-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  disabled={!newPassword || newPassword.length < 6}
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}