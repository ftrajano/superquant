'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => pathname === path;

  // Componentes reutilizáveis para padrões repetitivos
  const NavLink = ({ href, children, isAdmin = false }) => {
    const isCurrentlyActive = isActive(href);
    const linkStyle = {
      color: theme === 'dark' ? '#49db0f' : isAdmin ? 'var(--primary)' : isCurrentlyActive ? 'var(--text-primary)' : 'var(--text-secondary)'
    };
    
    return (
      <Link
        href={href}
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
          isCurrentlyActive ? 'border-primary font-semibold' : 'border-transparent hover:border-primary-light hover:text-primary'
        }`}
        style={linkStyle}
      >
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ href, children, isAdmin = false }) => {
    const isCurrentlyActive = isActive(href);
    const linkStyle = {
      color: theme === 'dark' ? '#49db0f' : isAdmin ? 'var(--primary)' : isCurrentlyActive ? 'var(--primary)' : 'var(--text-secondary)'
    };
    
    return (
      <Link
        href={href}
        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
          isCurrentlyActive ? 'bg-tonal border-primary' : 'border-transparent hover:bg-tonal hover:border-primary'
        }`}
        style={linkStyle}
        onClick={() => setIsMenuOpen(false)}
      >
        {children}
      </Link>
    );
  };

  const ThemeToggleButton = ({ mobile = false }) => {
    const buttonStyle = {
      color: theme === 'dark' ? '#49db0f' : 'var(--text-secondary)'
    };
    
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 ${mobile ? 'mr-2' : ''} rounded-full hover:bg-${mobile ? 'tonal' : 'surface-secondary'} transition-colors`}
        style={buttonStyle}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? (
          // Ícone do sol para modo claro
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          // Ícone da lua para modo escuro
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <nav className="bg-surface-bg dark:bg-surface-tonal shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--primary)' }}>
                SuperQuant
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {status === 'authenticated' && (
                <>
                  {/* Carteiras - apenas para modelo e admin */}
                  {(session?.user?.role === 'modelo' || session?.user?.role === 'admin') && (
                    <NavLink href="/carteiras">Carteiras</NavLink>
                  )}
                  <NavLink href="/copytrading">SuperQuant.IA</NavLink>
                  <NavLink href="/">Dashboard</NavLink>
                  {/* Links de administração - apenas para admins */}
                  {session?.user?.role === 'admin' && (
                    <NavLink href="/admin/usuarios" isAdmin>
                      Gerenciar Usuários
                    </NavLink>
                  )}
                  <NavLink href="/historico">Histórico</NavLink>
                  <NavLink href="/operacoes">Minhas Operações</NavLink>
                  <NavLink href="/quant">Quant</NavLink>
                  <NavLink href="/relatorios">Relatórios</NavLink>
                  <NavLink href="/assinatura">Assinatura</NavLink>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {status === 'authenticated' ? (
              <div className="ml-3 relative">
                <div className="flex items-center gap-3">
                  {/* Botão de alternar tema */}
                  <ThemeToggleButton />
                  
                  <Link
                    href="/perfil"
                    className={`${
                      isActive('/perfil') ? 'font-semibold' : ''
                    } text-sm font-medium transition-colors`}
                    style={{ color: theme === 'dark' ? '#49db0f' : isActive('/perfil') ? 'var(--primary)' : 'var(--text-secondary)' }}
                  >
                    Olá, {session.user.name}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded text-white bg-[#0a6d3a] hover:bg-[#085c30] dark:bg-[#4CAF50] dark:text-black dark:hover:bg-[#388E3C] transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Botão de alternar tema */}
                <ThemeToggleButton />
              
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1.5 border border-[var(--surface-border)] text-xs font-medium rounded bg-[var(--surface-card)] hover:bg-[var(--surface-secondary)] transition-colors"
                  style={{ color: theme === 'dark' ? '#49db0f' : 'var(--text-primary)' }}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded bg-[#0a6d3a] hover:bg-[#085c30] dark:bg-[var(--surface-card)] dark:hover:bg-[var(--surface-secondary)] transition-colors"
                  style={{color: theme === 'dark' ? '#49db0f' : 'white'}}
                >
                  Cadastre-se
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-surface-secondary transition-colors"
              style={{ color: theme === 'dark' ? '#49db0f' : 'var(--text-secondary)' }}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden bg-surface-card`}>
        <div className="pt-2 pb-3 space-y-1">
          {status === 'authenticated' ? (
            <>
              {/* Carteiras - apenas para modelo e admin */}
              {(session?.user?.role === 'modelo' || session?.user?.role === 'admin') && (
                <MobileNavLink href="/carteiras">Carteiras</MobileNavLink>
              )}
              <MobileNavLink href="/copytrading">SuperQuant.IA</MobileNavLink>
              <MobileNavLink href="/">Dashboard</MobileNavLink>
              {/* Admin links para mobile */}
              {session?.user?.role === 'admin' && (
                <MobileNavLink href="/admin/usuarios" isAdmin>
                  Gerenciar Usuários
                </MobileNavLink>
              )}
              <MobileNavLink href="/historico">Histórico</MobileNavLink>
              <MobileNavLink href="/perfil">Meu Perfil</MobileNavLink>
              <MobileNavLink href="/operacoes">Minhas Operações</MobileNavLink>
              <MobileNavLink href="/quant">Quant</MobileNavLink>
              <MobileNavLink href="/relatorios">Relatórios</MobileNavLink>
              <MobileNavLink href="/assinatura">Assinatura</MobileNavLink>
              
              <div className="flex items-center pl-3 pr-4 py-2">
                <ThemeToggleButton mobile />
                <span className="text-sm" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--text-secondary)' }}>
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </div>
              
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/login' });
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-tonal hover:border-error"
                style={{ color: theme === 'dark' ? '#49db0f' : 'var(--error)' }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <MobileNavLink href="/login">Entrar</MobileNavLink>
              <MobileNavLink href="/cadastro">Cadastre-se</MobileNavLink>
              
              <div className="flex items-center pl-3 pr-4 py-2">
                <ThemeToggleButton mobile />
                <span className="text-sm" style={{ color: theme === 'dark' ? '#49db0f' : 'var(--text-secondary)' }}>
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}