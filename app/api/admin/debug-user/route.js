import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    // Verificar autenticação admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado - apenas admin' }, { status: 403 });
    }
    
    // Buscar usuário específico
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'renato.spironelli@gmail.com';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        email 
      }, { status: 404 });
    }
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailConfirmed: user.emailConfirmed,
      hasPassword: !!user.password,
      passwordHash: user.password ? user.password.substring(0, 30) + '...' : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailConfirmToken: user.emailConfirmToken ? 'EXISTS' : null,
      emailConfirmTokenExpiry: user.emailConfirmTokenExpiry
    };
    
    const diagnosis = {
      canLogin: user.emailConfirmed !== false && !!user.password,
      issues: [
        ...(user.emailConfirmed === false ? ['❌ Email não confirmado (emailConfirmed = false)'] : []),
        ...(!user.password ? ['❌ Senha não definida'] : []),
        ...(user.emailConfirmed === undefined ? ['⚠️ Email confirmation status indefinido (usuário antigo?)'] : [])
      ],
      recommendations: []
    };
    
    if (user.emailConfirmed === false) {
      diagnosis.recommendations.push('Confirmar email do usuário ou alterar emailConfirmed para true');
    }
    
    return NextResponse.json({
      success: true,
      user: userData,
      diagnosis
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao verificar usuário',
      details: error.message 
    }, { status: 500 });
  }
}

// POST para corrigir problemas do usuário
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado - apenas admin' }, { status: 403 });
    }
    
    const { email, action } = await request.json();
    
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    if (action === 'confirm_email') {
      user.emailConfirmed = true;
      user.emailConfirmToken = null;
      user.emailConfirmTokenExpiry = null;
      await user.save();
      
      return NextResponse.json({ 
        success: true, 
        message: `Email confirmado para ${email}`,
        user: {
          email: user.email,
          emailConfirmed: user.emailConfirmed
        }
      });
    }
    
    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao corrigir usuário',
      details: error.message 
    }, { status: 500 });
  }
}