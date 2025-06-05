import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectToDatabase();
          
          // Buscar usuário pelo email
          const user = await User.findOne({ email: credentials.email });
          
          // Verificar se o usuário existe e a senha está correta
          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            return null;
          }

          // Verificar se o email foi confirmado (apenas para usuários novos)
          // Usuários antigos que não têm o campo emailConfirmed são considerados confirmados
          if (user.emailConfirmed === false) {
            throw new Error('Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.');
          }
          
          // Retornar o usuário sem a senha
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            emailConfirmed: user.emailConfirmed !== false // true para usuários antigos (undefined/null) e novos confirmados
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailConfirmed = user.emailConfirmed;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailConfirmed = token.emailConfirmed;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};