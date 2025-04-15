// lib/db/mongodb.js
import mongoose from 'mongoose';

// Variável para rastrear a conexão
let isConnected = false;

export const connectToDatabase = async () => {
  // Se já estiver conectado, use a conexão existente
  if (isConnected) {
    console.log('✅ Usando conexão MongoDB existente');
    return;
  }

  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não encontrado. Verifique seu arquivo .env.local');
    }

    console.log('🔄 Conectando ao MongoDB...');
    
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'opcoes-app',
    });

    isConnected = true;
    console.log('✅ Conectado ao MongoDB com sucesso!');
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
};