// scripts/ativar-pagamento-aprovado.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});
process.env.MONGODB_URI = envVars.MONGODB_URI;
process.env.MONGODB_DB = envVars.MONGODB_DB;
process.env.MERCADOPAGO_ACCESS_TOKEN = envVars.MERCADOPAGO_ACCESS_TOKEN;

const https = require('https');

console.log('🎯 ATIVAÇÃO DE PAGAMENTO APROVADO');

// Modelo do usuário
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  subscription: {
    plan: String,
    status: String,
    startDate: Date,
    expirationDate: Date,
    mercadoPagoPaymentId: String,
    lastPaymentAmount: Number,
    lastPaymentDate: Date,
    autoRenew: { type: Boolean, default: true }
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');

function getPaymentData(paymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: `/v1/payments/${paymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function ativarPagamento() {
  try {
    const paymentId = process.argv[2] || '119379388915';
    
    console.log('🔍 Verificando pagamento:', paymentId);
    
    // 1. Buscar dados do pagamento no MercadoPago
    const paymentData = await getPaymentData(paymentId);
    
    if (paymentData.status !== 'approved') {
      console.log('❌ Pagamento não está aprovado:', paymentData.status);
      return;
    }
    
    console.log('✅ Pagamento aprovado no MercadoPago');
    console.log('💰 Valor:', paymentData.transaction_amount);
    console.log('📧 Email:', paymentData.payer?.email);
    
    // 2. Conectar ao banco
    console.log('🔥 CONECTANDO AO BANCO...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB
    });
    
    // 3. Buscar usuário pelo email do pagamento
    const payerEmail = paymentData.payer?.email;
    if (!payerEmail) {
      console.log('❌ Email do pagador não encontrado');
      return;
    }
    
    const user = await User.findOne({ email: payerEmail });
    if (!user) {
      console.log('❌ Usuário não encontrado com email:', payerEmail);
      return;
    }
    
    console.log('👤 Usuário encontrado:', user.name);
    
    // 4. Verificar se já foi processado
    if (user.subscription?.mercadoPagoPaymentId === paymentId) {
      console.log('⚠️  Esse pagamento já foi processado anteriormente');
      console.log('📅 Assinatura válida até:', user.subscription.expirationDate?.toLocaleDateString('pt-BR'));
      return;
    }
    
    // 5. Determinar plano baseado no valor
    const amount = paymentData.transaction_amount;
    let planId = 'test';
    if (amount === 1 || amount === 1.00) {
      planId = 'test';
    } else if (amount === 117 || amount === 117.00) {
      planId = 'monthly';
    } else if (amount === 329 || amount === 329.00) {
      planId = 'quarterly';
    } else if (amount === 1297 || amount === 1297.00) {
      planId = 'yearly';
    }
    
    console.log('📋 Plano identificado:', planId);
    
    // 6. Ativar assinatura
    const startDate = new Date();
    const expirationDate = new Date();
    const duration = planId === 'test' ? 1 : planId === 'monthly' ? 1 : planId === 'quarterly' ? 3 : 12;
    expirationDate.setMonth(expirationDate.getMonth() + duration);
    
    const updateResult = await User.findByIdAndUpdate(
      user._id,
      {
        'subscription.plan': planId,
        'subscription.status': 'active',
        'subscription.startDate': startDate,
        'subscription.expirationDate': expirationDate,
        'subscription.mercadoPagoPaymentId': paymentId,
        'subscription.lastPaymentAmount': amount,
        'subscription.lastPaymentDate': startDate,
        'subscription.autoRenew': true
      },
      { new: true }
    );
    
    console.log('🎉 ASSINATURA ATIVADA COM SUCESSO!');
    console.log('📅 Válida até:', expirationDate.toLocaleDateString('pt-BR'));
    console.log('💰 Valor pago: R$', amount.toFixed(2));
    console.log('🆔 Payment ID:', paymentId);
    
  } catch (error) {
    console.error('💥 ERRO:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DESCONECTADO DO BANCO');
  }
}

ativarPagamento();