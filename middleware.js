// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas que NÃO precisam de assinatura (públicas)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/cadastro',
  '/auth/confirm-email',
  '/forgot-password',
  '/reset-password',
  '/assinatura',
  '/pagamento/sucesso',
  '/pagamento/erro',
  '/pagamento/pendente',
  '/api/auth',
  '/api/usuarios/register',
  '/api/webhooks',
  '/api/subscription/check',
  '/api/subscription/check-middleware',
  '/api/subscription/activate',
  '/api/pagamentos'
];

// Rotas de admin (não precisam de assinatura, só de role admin)
const ADMIN_ROUTES = [
  '/admin'
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Permitir arquivos estáticos
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/images') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Verificar se é rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar se é rota de admin
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Obter token da sessão
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Se não está logado, redirecionar para login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se é rota de admin, verificar role
  if (isAdminRoute) {
    if (token.role !== 'admin' && token.role !== 'modelo') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Para todas as outras rotas, verificar assinatura
  // Admins e usuários modelo têm acesso total (sem necessidade de assinatura)
  if (token.role === 'admin' || token.role === 'modelo') {
    return NextResponse.next();
  }

  // Verificar se tem assinatura ativa
  const hasSubscription = await checkActiveSubscription(token.sub);
  
  if (!hasSubscription) {
    const subscriptionUrl = new URL('/assinatura', request.url);
    subscriptionUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(subscriptionUrl);
  }

  return NextResponse.next();
}

// Função para verificar assinatura ativa via API
async function checkActiveSubscription(userId) {
  try {
    console.log('🔍 MIDDLEWARE: Verificando assinatura para userId:', userId);
    
    // Fazer chamada para API interna em vez de acessar banco diretamente
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/subscription/check-middleware`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      console.log('❌ MIDDLEWARE: Erro na API:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('✅ MIDDLEWARE: Resposta da API:', data);
    
    return data.hasActiveSubscription || false;
  } catch (error) {
    console.error('💥 MIDDLEWARE: Erro ao verificar assinatura:', error);
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};