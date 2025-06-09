import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { sendEmailConfirmation } from '@/lib/resend';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validar dados
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    await connectToDatabase();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gerar token de confirmação de email
    const emailConfirmToken = crypto.randomBytes(32).toString('hex');
    const emailConfirmTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar novo usuário
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      emailConfirmed: false, // Explicitamente false para novos usuários
      emailConfirmToken,
      emailConfirmTokenExpiry
    });

    // Enviar email de confirmação
    try {
      console.log('Tentando enviar email de confirmação para:', email);
      const emailResult = await sendEmailConfirmation(email, name, emailConfirmToken);
      console.log('Email enviado com sucesso:', emailResult);
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
      // Continue mesmo se o email falhar
    }

    // Remover a senha do objeto de resposta
    const user = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      emailConfirmed: newUser.emailConfirmed
    };

    return NextResponse.json({ 
      user,
      message: 'Usuário criado com sucesso! Verifique seu email para confirmar sua conta.'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}