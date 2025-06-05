import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

// Essa rota só deve ser usada uma vez para criar o primeiro administrador

export async function POST(request) {
  try {
    const { name, email, password, setupKey } = await request.json();

    // Verificar chave de setup
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: 'Chave de setup inválida' },
        { status: 403 }
      );
    }

    // Validar dados
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    try {
      await connectToDatabase();
    } catch (dbError) {
      return NextResponse.json(
        { error: `Erro de conexão com o banco de dados: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Verificar se já existe algum admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Já existe um administrador configurado' },
        { status: 400 }
      );
    }

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

    // Criar o administrador
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      emailConfirmed: true // Admin não precisa confirmar email
    });

    // Remover a senha do objeto de resposta
    const admin = {
      id: newAdmin._id.toString(),
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    };

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
}