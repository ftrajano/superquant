// app/api/check-auth/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'Usuário não autenticado',
        session: null
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      message: 'Usuário autenticado',
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          hasId: !!session.user.id
        },
        expires: session.expires
      }
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'Erro ao verificar autenticação',
      error: error.message
    }, { status: 500 });
  }
}