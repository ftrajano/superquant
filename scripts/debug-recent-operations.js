#!/usr/bin/env node

// Script para debugar operações recentes do usuário modelo
// Uso: MONGODB_URI="sua-uri" node scripts/debug-recent-operations.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { timestamps: true });

const OperacaoSchema = new mongoose.Schema({
  userId: String,
  idVisual: String,
  ticker: String,
  nome: String,
  tipo: String,
  direcao: String,
  status: String,
  resultadoTotal: Number,
  dataAbertura: Date,
  dataFechamento: Date,
  operacaoOriginalId: String,
  operacoesRelacionadas: [String],
  preco: Number,
  quantidade: Number,
  valorTotal: Number,
  mesReferencia: String,
  anoReferencia: Number
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');
const Operacao = mongoose.model('Operacao', OperacaoSchema, 'operacoes');

async function debugRecentOperations() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    // Buscar usuário modelo
    console.log('\n🔍 Buscando usuário modelo...');
    const modeloUser = await User.findOne({ role: 'modelo' }).lean();
    
    if (!modeloUser) {
      console.log('❌ Nenhum usuário modelo encontrado!');
      return;
    }
    
    console.log('👑 Usuário modelo encontrado:');
    console.log(`   Nome: ${modeloUser.name}`);
    console.log(`   Email: ${modeloUser.email}`);
    console.log(`   ID: ${modeloUser._id}`);

    // Buscar operações recentes do usuário modelo (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log('\n🔍 Buscando operações recentes do usuário modelo (últimas 24h)...');
    console.log(`Desde: ${oneDayAgo.toLocaleString('pt-BR')}`);
    
    const recentOperations = await Operacao.find({
      userId: modeloUser._id.toString(),
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }).lean();
    
    console.log(`\n📊 Encontradas ${recentOperations.length} operações recentes:`);
    
    if (recentOperations.length === 0) {
      console.log('❌ Nenhuma operação foi criada nas últimas 24 horas!');
      console.log('💡 Isso pode explicar por que não houve notificação.');
    } else {
      recentOperations.forEach((op, i) => {
        console.log(`\n${i+1}. OPERAÇÃO ${op.idVisual}:`);
        console.log(`   Ticker: ${op.ticker}`);
        console.log(`   Tipo: ${op.tipo} ${op.direcao}`);
        console.log(`   Status: ${op.status}`);
        console.log(`   Criada: ${op.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   Data Abertura: ${op.dataAbertura ? op.dataAbertura.toLocaleString('pt-BR') : 'N/A'}`);
        console.log(`   UserId: ${op.userId}`);
        console.log(`   Valor: R$ ${op.valorTotal || 0}`);
        
        // Verificar se o userId está correto
        if (op.userId === modeloUser._id.toString()) {
          console.log('   ✅ UserId correto - deveria ter enviado notificação');
        } else {
          console.log('   ❌ UserId incorreto - não enviaria notificação');
        }
      });
    }

    // Buscar também as 5 operações mais recentes independente de data
    console.log('\n🔍 Últimas 5 operações do usuário modelo (qualquer data):');
    
    const lastOperations = await Operacao.find({
      userId: modeloUser._id.toString()
    }).sort({ createdAt: -1 }).limit(5).lean();
    
    lastOperations.forEach((op, i) => {
      console.log(`\n${i+1}. ${op.idVisual} - ${op.ticker}`);
      console.log(`   Status: ${op.status}`);
      console.log(`   Criada: ${op.createdAt.toLocaleString('pt-BR')}`);
      console.log(`   Valor: R$ ${op.valorTotal || 0}`);
    });

    // Verificar se há problemas com a função de notificação
    console.log('\n🤖 Testando função de notificação diretamente...');
    try {
      const { notifyOperacaoAbertura } = require('../lib/telegram');
      
      if (recentOperations.length > 0) {
        const testOp = recentOperations[0];
        console.log(`Testando notificação para operação ${testOp.idVisual}...`);
        
        const result = await notifyOperacaoAbertura(testOp);
        if (result) {
          console.log('✅ Função de notificação funcionou!');
        } else {
          console.log('❌ Função de notificação falhou!');
        }
      }
    } catch (telegramError) {
      console.error('❌ Erro na função de notificação:', telegramError.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

debugRecentOperations();