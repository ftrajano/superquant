'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function ControleAssinaturas() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [newPlan, setNewPlan] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  // Verificar autorização
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'modelo')) {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assinaturas');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error('Erro ao carregar usuários:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId, action, data = {}) => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/admin/assinaturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action, // 'activate', 'extend', 'deactivate'
          ...data
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchUsers(); // Recarregar lista
        setEditingUser(null);
        setNewExpirationDate('');
      } else {
        alert('Erro: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      alert('Erro ao processar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status, expirationDate) => {
    if (status !== 'active') return 'text-red-600';
    if (!expirationDate) return 'text-gray-600';
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'text-red-600';
    if (daysUntilExpiration < 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = (status, expirationDate) => {
    if (status !== 'active') return 'Inativa';
    if (!expirationDate) return 'Sem prazo';
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    
    if (expDate < now) return 'Expirada';
    
    const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration === 0) return 'Expira hoje';
    if (daysUntilExpiration === 1) return 'Expira amanhã';
    if (daysUntilExpiration < 7) return `Expira em ${daysUntilExpiration} dias`;
    
    return 'Ativa';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && user.subscription?.status === 'active';
    if (statusFilter === 'inactive') return matchesSearch && user.subscription?.status !== 'active';
    if (statusFilter === 'expiring') {
      const expDate = user.subscription?.expirationDate ? new Date(user.subscription.expirationDate) : null;
      const now = new Date();
      const daysUntilExp = expDate ? Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)) : -1;
      return matchesSearch && daysUntilExp >= 0 && daysUntilExp <= 7;
    }
    
    return matchesSearch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)]">
        <NavBar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                Controle de Assinaturas
              </h1>
              <p className="text-[var(--text-secondary)]">
                Gerencie assinaturas dos usuários - Ativar, estender ou desativar acessos
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/contabilidade')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              📊 Relatório Contábil
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="expiring">Expirando (7 dias)</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total</h3>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{users.length}</p>
          </div>
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Ativas</h3>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.subscription?.status === 'active').length}
            </p>
          </div>
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Inativas</h3>
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.subscription?.status !== 'active').length}
            </p>
          </div>
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Expirando</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {users.filter(u => {
                const expDate = u.subscription?.expirationDate ? new Date(u.subscription.expirationDate) : null;
                const now = new Date();
                const days = expDate ? Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)) : -1;
                return days >= 0 && days <= 7;
              }).length}
            </p>
          </div>
        </div>

        {/* Lista de usuários */}
        <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                        {user.role && user.role !== 'user' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getStatusColor(user.subscription?.status, user.subscription?.expirationDate)}`}>
                        {getStatusText(user.subscription?.status, user.subscription?.expirationDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[var(--text-primary)]">
                        {user.subscription?.plan === 'monthly' ? 'Mensal' :
                         user.subscription?.plan === 'quarterly' ? 'Trimestral' :
                         user.subscription?.plan === 'yearly' ? 'Anual' : 'Sem plano'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">
                      {formatDate(user.subscription?.expirationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user._id ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <select
                              value={newPlan}
                              onChange={(e) => setNewPlan(e.target.value)}
                              className="text-sm px-2 py-1 border rounded"
                              disabled={processing}
                            >
                              <option value="monthly">Mensal</option>
                              <option value="quarterly">Trimestral</option>
                              <option value="yearly">Anual</option>
                            </select>
                            <input
                              type="date"
                              value={newExpirationDate}
                              onChange={(e) => setNewExpirationDate(e.target.value)}
                              className="text-sm px-2 py-1 border rounded"
                              disabled={processing}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateSubscription(user._id, 'activate', {
                                plan: newPlan,
                                expirationDate: newExpirationDate
                              })}
                              disabled={processing || !newExpirationDate}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {processing ? '...' : 'Salvar'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setNewExpirationDate('');
                                setNewPlan('monthly');
                              }}
                              disabled={processing}
                              className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingUser(user._id);
                              setNewPlan(user.subscription?.plan || 'monthly');
                              // Sugerir data padrão (30 dias à frente)
                              const defaultDate = new Date();
                              defaultDate.setDate(defaultDate.getDate() + 30);
                              setNewExpirationDate(defaultDate.toISOString().split('T')[0]);
                            }}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            {user.subscription?.status === 'active' ? 'Editar' : 'Ativar'}
                          </button>
                          {user.subscription?.status === 'active' && (
                            <button
                              onClick={() => handleUpdateSubscription(user._id, 'deactivate')}
                              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Desativar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                Nenhum usuário encontrado com os filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}