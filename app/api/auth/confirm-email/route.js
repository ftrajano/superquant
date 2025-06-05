// app/api/auth/confirm-email/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de confirmação não fornecido' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar usuário pelo token
    const user = await User.findOne({
      emailConfirmToken: token,
      emailConfirmTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Confirmar email
    user.emailConfirmed = true;
    user.emailConfirmToken = null;
    user.emailConfirmTokenExpiry = null;
    await user.save();

    return NextResponse.json({
      message: 'Email confirmado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao confirmar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}