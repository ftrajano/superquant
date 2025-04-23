import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

// Habilitar logs para debug
console.log('API de setup-admin carregada');

// Essa rota só deve ser usada uma vez para criar o primeiro administrador
// Em produção, ela deveria ser protegida ou removida após o uso

export async function POST(request) {
  try {
    console.log('Recebida requisição POST em /api/setup-admin');
    const { name, email, password, setupKey } = await request.json();
    console.log('Dados recebidos:', { name, email, setupKeyProvided: !!setupKey });
    
    console.log('Chave env:', process.env.ADMIN_SETUP_KEY);
    console.log('Chave fornecida:', setupKey);

    // Verificar chave de setup (isso é uma proteção simples, não segura o suficiente para produção)
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      console.log('Chave de setup inválida');
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
    console.log('Tentando conectar ao MongoDB...');
    try {
      await connectToDatabase();
      console.log('Conexão com MongoDB bem sucedida');
    } catch (dbError) {
      console.error('Erro ao conectar ao MongoDB:', dbError);
      return NextResponse.json(
        { error: `Erro de conexão com o banco de dados: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Verificar se já existe algum admin
    console.log('Verificando se já existe um administrador...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Administrador já existe:', existingAdmin.email);
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
      role: 'admin'
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
    console.error('Erro ao criar administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
}