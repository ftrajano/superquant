#!/usr/bin/env node

// Script para verificar coleções do banco de dados
const mongoose = require('mongoose');

async function checkDatabaseCollections() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    // Listar todas as coleções
    console.log('\n📋 Coleções no banco de dados:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documentos`);
    }

    if (collections.length === 0) {
      console.log('❌ Nenhuma coleção encontrada no banco de dados!');
    }

    // Verificar especificamente a coleção operacoes
    console.log('\n🔍 Verificando coleção "operacoes":');
    try {
      const operacoesCount = await mongoose.connection.db.collection('operacoes').countDocuments();
      console.log(`Total de documentos em operacoes: ${operacoesCount}`);

      // Buscar uma operação de exemplo para verificar a estrutura
      const sampleOp = await mongoose.connection.db.collection('operacoes').findOne();
      if (sampleOp) {
        console.log('\n📄 Exemplo de operação:');
        console.log(JSON.stringify(sampleOp, null, 2));
      } else {
        console.log('❌ Nenhuma operação encontrada na coleção');
      }
    } catch (error) {
      console.error('❌ Erro ao acessar coleção operacoes:', error.message);
    }

    // Verificar especificamente a coleção users  
    console.log('\n🔍 Verificando coleção "users":');
    try {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`Total de usuários: ${usersCount}`);

      // Verificar usuários modelo
      const modeloUsers = await mongoose.connection.db.collection('users').find({ role: 'modelo' }).toArray();
      console.log(`Usuários modelo: ${modeloUsers.length}`);
      
      modeloUsers.forEach(user => {
        console.log(`   ${user.name} (${user.email}) - ID: ${user._id}`);
      });
    } catch (error) {
      console.error('❌ Erro ao acessar coleção users:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

checkDatabaseCollections();