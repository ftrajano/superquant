// scripts/fix-operation.js
import { connectToDatabase } from '../lib/db/mongodb.js';
import mongoose from 'mongoose';
import Operacao from '../lib/models/Operacao.js';

// Definir a variável de ambiente para a conexão
process.env.MONGODB_URI = 'mongodb+srv://ftrajano:D3TPkdaFlNSZTMq5@superquant-cluster.mu4ve.mongodb.net/?retryWrites=true&w=majority&appName=superquant-cluster';
process.env.MONGODB_DB = 'opcoes-app';

// Função para corrigir a operação OP-6856
async function fixOperation() {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Buscar a operação pelo código
    const operacao = await Operacao.findOne({ 
      idVisual: { $regex: new RegExp('^op-6856$', 'i') } 
    });
    
    if (!operacao) {
      console.log('Operação OP-6856 não encontrada');
      return;
    }
    
    console.log('------ ANTES DA CORREÇÃO ------');
    console.log(`ID: ${operacao._id}`);
    console.log(`Código: ${operacao.idVisual}`);
    console.log(`Preço: ${operacao.preco}`);
    console.log(`Quantidade: ${operacao.quantidade}`);
    console.log(`Valor Total Armazenado: ${operacao.valorTotal}`);
    
    // Recalcular o valor total corretamente
    const valorCorrigido = operacao.preco * operacao.quantidade;
    
    // Atualizar o valor total no banco de dados
    operacao.valorTotal = valorCorrigido;
    await operacao.save();
    
    console.log('------ APÓS A CORREÇÃO ------');
    console.log(`ID: ${operacao._id}`);
    console.log(`Código: ${operacao.idVisual}`);
    console.log(`Preço: ${operacao.preco}`);
    console.log(`Quantidade: ${operacao.quantidade}`);
    console.log(`Valor Total Atualizado: ${operacao.valorTotal}`);
    console.log('Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao corrigir operação:', error);
  } finally {
    // Fechar a conexão com o banco
    if (mongoose.connection.readyState !== 0) {
      console.log('Fechando conexão...');
      await mongoose.connection.close();
    }
  }
}

// Executar a função de correção
await fixOperation();