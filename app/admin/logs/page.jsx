'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function LogsAuditoria() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  // Filtros
  const [filters, setFilters] = useState({
    category: 'all',
    action: 'all',
    startDate: '',
    endDate: '',
    page: 1
  });

  // Verificar autorização - APENAS ADMIN
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchLogs();
  }, [session, status, router, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          searchParams.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/logs?${searchParams.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs || []);
        setPagination(data.pagination || {});
      } else {
        console.error('Erro ao carregar logs:', data.error);
        if (response.status === 403) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionColor = (action) => {
    const colors = {
      activate: 'text-green-600 bg-green-100',
      extend: 'text-blue-600 bg-blue-100', 
      deactivate: 'text-red-600 bg-red-100',
      create_user: 'text-purple-600 bg-purple-100',
      delete_user: 'text-red-800 bg-red-200'
    };
    return colors[action] || 'text-gray-600 bg-gray-100';
  };

  const getActionText = (action) => {
    const actions = {
      activate: 'Ativar',
      extend: 'Estender',
      deactivate: 'Desativar',
      create_user: 'Criar Usuário',
      delete_user: 'Excluir Usuário'
    };
    return actions[action] || action;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset para primeira página quando filtro muda
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)]">
        <NavBar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2">Carregando logs...</p>
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            🔒 Logs de Auditoria
          </h1>
          <p className="text-[var(--text-secondary)]">
            Histórico completo de ações administrativas no sistema (Acesso restrito ao administrador)
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[var(--surface-card)] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="subscription">Assinaturas</option>
                <option value="user_management">Gestão de Usuários</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Ação
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="activate">Ativar</option>
                <option value="extend">Estender</option>
                <option value="deactivate">Desativar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total de Logs</h3>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{pagination.totalCount || 0}</p>
          </div>
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Página Atual</h3>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{pagination.page || 1}</p>
          </div>
          <div className="bg-[var(--surface-card)] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total de Páginas</h3>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{pagination.totalPages || 1}</p>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executado Por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário Alvo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-primary)]">{formatDate(log.timestamp)}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">IP: {log.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-[var(--text-primary)]">{log.performedBy.userName}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{log.performedBy.userEmail}</div>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {log.performedBy.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {getActionText(log.action)}
                      </span>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">{log.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.targetUser ? (
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{log.targetUser.userName}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{log.targetUser.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--text-primary)] mb-1">{log.description}</div>
                      {log.details && (
                        <div className="text-xs text-[var(--text-secondary)]">
                          {log.details.subscriptionPlan && (
                            <div>Plano: {log.details.subscriptionPlan}</div>
                          )}
                          {log.details.newExpirationDate && (
                            <div>Nova validade: {formatDate(log.details.newExpirationDate)}</div>
                          )}
                          {log.details.amount && (
                            <div>Valor: R$ {log.details.amount.toFixed(2)}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                Nenhum log encontrado com os filtros aplicados.
              </div>
            )}
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-[var(--text-secondary)]">
                Mostrando {Math.min((pagination.page - 1) * 50 + 1, pagination.totalCount)} a{' '}
                {Math.min(pagination.page * 50, pagination.totalCount)} de {pagination.totalCount} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-[var(--text-primary)]">
                  {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}