import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendPasswordReset } from '@/lib/resend';

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

    // Enviar email de reset
    try {
      await sendPasswordReset(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error('Erro ao enviar email de reset:', emailError);
      // Não falhar a operação por causa do email
    }

    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de reset:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}