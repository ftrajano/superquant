// scripts/check-operation-temp.js
import { connectToDatabase } from '../lib/db/mongodb.js';
import mongoose from 'mongoose';
import Operacao from '../lib/models/Operacao.js';

// Definir a variável de ambiente para a conexão
process.env.MONGODB_URI = 'mongodb+srv://ftrajano:D3TPkdaFlNSZTMq5@superquant-cluster.mu4ve.mongodb.net/?retryWrites=true&w=majority&appName=superquant-cluster';
process.env.MONGODB_DB = 'opcoes-app';

// Função para buscar a operação por código (idVisual)
async function findOperationByCode(codigo) {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!');
    
    console.log(`Buscando operação com código: ${codigo}`);
    
    // Buscar a operação pelo código exato primeiro
    let operacao = await Operacao.findOne({ idVisual: codigo });
    
    // Se não encontrar, tenta case insensitive
    if (!operacao) {
      console.log(`Operação com código exato ${codigo} não encontrada. Tentando case insensitive...`);
      
      operacao = await Operacao.findOne({ 
        idVisual: { $regex: new RegExp('^' + codigo + '$', 'i') } 
      });
      
      if (!operacao) {
        console.log(`Tentando sem o formato específico...`);
        // Tentar sem o formato específico (ex: buscando 6856 em vez de op-6856)
        const numeroOperacao = codigo.replace(/^op-/i, '');
        operacao = await Operacao.findOne({ 
          idVisual: { $regex: new RegExp(numeroOperacao + '$', 'i') } 
        });
      }
    }
    
    if (!operacao) {
      console.log(`Nenhuma operação encontrada com código similar a ${codigo}`);
      return null;
    }
    
    console.log(`Encontrada operação: ${operacao.idVisual}`);
    
    // Calcular o valor total esperado para validação
    const valorTotalEsperado = operacao.preco * operacao.quantidade;
    console.log('------ DETALHES DA OPERAÇÃO ------');
    console.log(`ID: ${operacao._id}`);
    console.log(`Código: ${operacao.idVisual}`);
    console.log(`Ticker: ${operacao.ticker}`);
    console.log(`Tipo: ${operacao.tipo}`);
    console.log(`Direção: ${operacao.direcao}`);
    console.log(`Preço: ${operacao.preco}`);
    console.log(`Quantidade: ${operacao.quantidade}`);
    console.log(`Valor Total Armazenado: ${operacao.valorTotal}`);
    console.log(`Valor Total Esperado (recalculado): ${valorTotalEsperado}`);
    console.log(`Diferença: ${valorTotalEsperado - operacao.valorTotal}`);
    
    return operacao;
  } catch (error) {
    console.error('Erro ao buscar operação:', error);
    throw error;
  } finally {
    // Fechar a conexão com o banco
    if (mongoose.connection.readyState !== 0) {
      console.log('Fechando conexão...');
      await mongoose.connection.close();
    }
  }
}

// Chamar a função com o código da operação informado
await findOperationByCode('op-6856');