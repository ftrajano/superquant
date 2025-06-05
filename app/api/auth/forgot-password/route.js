import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar usuário pelo email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Por segurança, sempre retornamos sucesso mesmo se o email não existir
    // Isso evita que alguém descubra quais emails estão cadastrados
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no usuário
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry
    });

    // TODO: Aqui você implementaria o envio de email
    // Por enquanto, vamos apenas log do token para desenvolvimento
    console.log(`Reset token para ${email}: ${resetToken}`);
    console.log(`Link de reset: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
      // Em desenvolvimento, retornamos o token. REMOVER em produção!
      ...(process.env.NODE_ENV === 'development' && { 
        developmentToken: resetToken,
        developmentLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      })
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de reset:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}