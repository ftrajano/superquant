#!/usr/bin/env node

// Script para verificar diretamente a coleção operacaos
const mongoose = require('mongoose');

async function debugOperacaosCollection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    // Buscar usuário modelo primeiro
    const modeloUser = await mongoose.connection.db.collection('users').findOne({ role: 'modelo' });
    
    if (!modeloUser) {
      console.log('❌ Nenhum usuário modelo encontrado!');
      return;
    }
    
    console.log('👑 Usuário modelo:');
    console.log(`   Nome: ${modeloUser.name}`);
    console.log(`   Email: ${modeloUser.email}`);
    console.log(`   ID: ${modeloUser._id}`);

    // Acessar diretamente a coleção operacaos
    console.log('\n🔍 Verificando coleção "operacaos":');
    const totalOps = await mongoose.connection.db.collection('operacaos').countDocuments();
    console.log(`Total de operações: ${totalOps}`);

    // Buscar operações recentes (últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentOps = await mongoose.connection.db.collection('operacaos').find({
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\nOperações das últimas 24h: ${recentOps.length}`);
    
    // Buscar operações do usuário modelo
    const modeloUserId = modeloUser._id.toString();
    
    const modeloOpsRecent = await mongoose.connection.db.collection('operacaos').find({
      userId: modeloUserId,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\nOperações do usuário modelo (últimas 24h): ${modeloOpsRecent.length}`);
    
    if (modeloOpsRecent.length > 0) {
      console.log('\n🎯 OPERAÇÕES RECENTES DO MODELO:');
      modeloOpsRecent.forEach((op, i) => {
        console.log(`\n${i+1}. ${op.idVisual || op._id}:`);
        console.log(`   Ticker: ${op.ticker}`);
        console.log(`   Tipo: ${op.tipo} ${op.direcao}`);
        console.log(`   Status: ${op.status}`);
        console.log(`   Criada: ${op.createdAt ? op.createdAt.toLocaleString('pt-BR') : 'N/A'}`);
        console.log(`   UserId: ${op.userId}`);
        console.log('   🤖 Esta operação deveria ter gerado notificação!');
      });
    }

    // Buscar últimas operações do modelo independente de data
    const lastModeloOps = await mongoose.connection.db.collection('operacaos').find({
      userId: modeloUserId
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`\n🔍 Últimas 5 operações do modelo (qualquer data): ${lastModeloOps.length}`);
    
    lastModeloOps.forEach((op, i) => {
      console.log(`\n${i+1}. ${op.idVisual || op._id}:`);
      console.log(`   Ticker: ${op.ticker}`);
      console.log(`   Criada: ${op.createdAt ? op.createdAt.toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Status: ${op.status}`);
    });

    // Verificar se há operações muito recentes de qualquer usuário
    const veryRecentOps = await mongoose.connection.db.collection('operacaos').find({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Última hora
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n⏰ Operações da última hora (todos os usuários): ${veryRecentOps.length}`);
    
    if (veryRecentOps.length > 0) {
      console.log('\n🔥 OPERAÇÕES MUITO RECENTES:');
      
      for (const op of veryRecentOps) {
        const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(op.userId) });
        
        console.log(`\n• ${op.idVisual || op._id}:`);
        console.log(`   Por: ${user?.name || 'USUÁRIO DESCONHECIDO'} (${user?.role || 'ROLE DESCONHECIDA'})`);
        console.log(`   Ticker: ${op.ticker}`);
        console.log(`   Criada: ${op.createdAt.toLocaleString('pt-BR')}`);
        
        if (user?.role === 'modelo') {
          console.log('   🚨 ESTA OPERAÇÃO DEVERIA TER GERADO NOTIFICAÇÃO!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

debugOperacaosCollection();