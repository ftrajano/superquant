import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Acessar diretamente a coleção
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Listar todos os usuários com seus papéis
    const users = await usersCollection.find({}).project({ name: 1, email: 1, role: 1 }).toArray();
    
    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role || 'não definido'
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}