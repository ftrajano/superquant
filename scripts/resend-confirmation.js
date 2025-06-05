// Script para reenviar email de confirmação
import { connectToDatabase } from '../lib/db/mongodb.js';
import User from '../lib/models/User.js';
import { sendEmailConfirmation } from '../lib/resend.js';
import crypto from 'crypto';

const email = process.argv[2];

if (!email) {
  console.log('Uso: node scripts/resend-confirmation.js email@exemplo.com');
  process.exit(1);
}

async function resendConfirmation() {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }
    
    if (user.emailConfirmed) {
      console.log('Email já confirmado');
      return;
    }
    
    // Gerar novo token
    const emailConfirmToken = crypto.randomBytes(32).toString('hex');
    const emailConfirmTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    user.emailConfirmToken = emailConfirmToken;
    user.emailConfirmTokenExpiry = emailConfirmTokenExpiry;
    await user.save();
    
    // Enviar email
    await sendEmailConfirmation(email, user.name, emailConfirmToken);
    console.log('Email de confirmação reenviado com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

resendConfirmation();