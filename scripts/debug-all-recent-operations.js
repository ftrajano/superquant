#!/usr/bin/env node

// Script para verificar TODAS as operações recentes no sistema
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

async function debugAllRecentOperations() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    // Buscar TODAS as operações das últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log('\n🔍 Buscando TODAS as operações das últimas 24 horas...');
    console.log(`Desde: ${oneDayAgo.toLocaleString('pt-BR')}`);
    
    const recentOperations = await Operacao.find({
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }).lean();
    
    console.log(`\n📊 Total de operações criadas nas últimas 24h: ${recentOperations.length}`);
    
    if (recentOperations.length === 0) {
      console.log('❌ NENHUMA operação foi criada nas últimas 24 horas!');
      console.log('💡 Isso indica que o problema pode estar na criação de operações em geral.');
    } else {
      // Buscar informações dos usuários
      const userIds = [...new Set(recentOperations.map(op => op.userId))];
      const users = await User.find({ _id: { $in: userIds } }).lean();
      const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = user;
        return acc;
      }, {});

      recentOperations.forEach((op, i) => {
        const user = userMap[op.userId] || { name: 'USUÁRIO NÃO ENCONTRADO', role: 'DESCONHECIDO', email: 'N/A' };
        
        console.log(`\n${i+1}. OPERAÇÃO ${op.idVisual}:`);
        console.log(`   Criada por: ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Ticker: ${op.ticker}`);
        console.log(`   Tipo: ${op.tipo} ${op.direcao}`);
        console.log(`   Status: ${op.status}`);
        console.log(`   Criada: ${op.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   UserId: ${op.userId}`);
        
        // Verificar se deveria ter enviado notificação
        if (user.role === 'modelo') {
          console.log('   🤖 DEVERIA TER ENVIADO NOTIFICAÇÃO!');
        } else {
          console.log(`   ⚪ Não envia notificação (role: ${user.role})`);
        }
      });
    }

    // Buscar as últimas 10 operações independente de data para verificar atividade geral
    console.log('\n🔍 Últimas 10 operações do sistema (qualquer data):');
    
    const lastOperations = await Operacao.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const lastUserIds = [...new Set(lastOperations.map(op => op.userId))];
    const lastUsers = await User.find({ _id: { $in: lastUserIds } }).lean();
    const lastUserMap = lastUsers.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    lastOperations.forEach((op, i) => {
      const user = lastUserMap[op.userId] || { name: 'USUÁRIO NÃO ENCONTRADO', role: 'DESCONHECIDO' };
      console.log(`\n${i+1}. ${op.idVisual} - ${op.ticker}`);
      console.log(`   Por: ${user.name} (${user.role})`);
      console.log(`   Criada: ${op.createdAt.toLocaleString('pt-BR')}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

debugAllRecentOperations();