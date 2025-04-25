'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para o formulário de alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Redirecionar se não estiver autenticado
  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }
  
  // Se ainda estiver carregando a sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Atualizar dados do formulário
  const handleChangePassword = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Enviar formulário de alteração de senha
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      // Validações no front-end
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('Todos os campos são obrigatórios');
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('A nova senha e a confirmação não correspondem');
      }
      
      if (passwordData.newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }
      
      // Enviar solicitação para a API
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha');
      }
      
      // Limpar formulário e mostrar mensagem de sucesso
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Senha alterada com sucesso!');
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao alterar a senha');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Meu Perfil</h1>
            <p className="text-[var(--text-secondary)]">Gerencie suas informações pessoais</p>
          </div>
        </div>
        
        {/* Informações do Usuário */}
        <div className="bg-[var(--surface-card)] rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Informações Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-tertiary)]">Nome</p>
              <p className="text-lg text-[var(--text-primary)]">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-tertiary)]">Email</p>
              <p className="text-lg text-[var(--text-primary)]">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-tertiary)]">Tipo de Conta</p>
              <p className="text-lg capitalize text-[var(--text-primary)]">{session.user.role || 'Usuário'}</p>
            </div>
          </div>
        </div>
        
        {/* Alterar Senha */}
        <div className="bg-[var(--surface-card)] rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Alterar Senha</h2>
          
          {/* Mensagens de erro e sucesso */}
          {error && (
            <div className="mb-4 bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmitPassword}>
            <div className="mb-4">
              <label className="block text-[var(--text-primary)] text-sm font-bold mb-2" htmlFor="currentPassword">
                Senha Atual
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="shadow appearance-none border border-[var(--surface-border)] rounded w-full md:w-1/2 py-2 px-3 text-[var(--text-primary)] bg-[var(--surface-bg)] leading-tight focus:outline-none focus:shadow-outline focus:border-[var(--primary)]"
                value={passwordData.currentPassword}
                onChange={handleChangePassword}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-[var(--text-primary)] text-sm font-bold mb-2" htmlFor="newPassword">
                Nova Senha
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="shadow appearance-none border border-[var(--surface-border)] rounded w-full md:w-1/2 py-2 px-3 text-[var(--text-primary)] bg-[var(--surface-bg)] leading-tight focus:outline-none focus:shadow-outline focus:border-[var(--primary)]"
                value={passwordData.newPassword}
                onChange={handleChangePassword}
                required
                minLength={6}
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">A senha deve ter pelo menos 6 caracteres</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-[var(--text-primary)] text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="shadow appearance-none border border-[var(--surface-border)] rounded w-full md:w-1/2 py-2 px-3 text-[var(--text-primary)] bg-[var(--surface-bg)] leading-tight focus:outline-none focus:shadow-outline focus:border-[var(--primary)]"
                value={passwordData.confirmPassword}
                onChange={handleChangePassword}
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isLoading}
              >
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}