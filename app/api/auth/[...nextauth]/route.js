import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Criar o handler do NextAuth para as rotas GET e POST
const handler = NextAuth(authOptions);

// Exportar apenas as funções de handler, não o authOptions
export { handler as GET, handler as POST };