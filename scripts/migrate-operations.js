// scripts/migrate-operations.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Definir o schema de Operação
const OperacaoSchema = new mongoose.Schema({
  mesReferencia: String,
  anoReferencia: Number
});

async function migrateOperations() {
  try {
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/superquant';
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Carregar o modelo de Operação
    const Operacao = mongoose.model('Operacao', OperacaoSchema);

    // Buscar todas as operações que não têm anoReferencia
    const operacoesSemAno = await Operacao.find({ anoReferencia: { $exists: false } });
    console.log(`Encontradas ${operacoesSemAno.length} operações sem o campo anoReferencia`);

    // Atualizar cada operação
    const anoAtual = new Date().getFullYear();
    const promises = operacoesSemAno.map(async (op) => {
      await Operacao.updateOne(
        { _id: op._id },
        { $set: { anoReferencia: anoAtual } }
      );
      return op._id;
    });

    // Aguardar todas as atualizações terminarem
    await Promise.all(promises);
    console.log(`Migração concluída. ${operacoesSemAno.length} operações atualizadas.`);

  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    // Fechar a conexão
    await mongoose.connection.close();
    console.log('Conexão com o MongoDB fechada');
  }
}

// Executar a migração
migrateOperations();
