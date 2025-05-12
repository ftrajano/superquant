// scripts/fix-operation-result.js
import { connectToDatabase } from '../lib/db/mongodb.js';
import mongoose from 'mongoose';
import Operacao from '../lib/models/Operacao.js';

// Definir a variável de ambiente para a conexão
process.env.MONGODB_URI = 'mongodb+srv://ftrajano:D3TPkdaFlNSZTMq5@superquant-cluster.mu4ve.mongodb.net/?retryWrites=true&w=majority&appName=superquant-cluster';
process.env.MONGODB_DB = 'opcoes-app';

// Função para corrigir o resultado da operação OP-6856
async function fixOperationResult() {
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
    
    console.log('------ VALORES ATUAIS ------');
    console.log(`ID: ${operacao._id}`);
    console.log(`Código: ${operacao.idVisual}`);
    console.log(`Status: ${operacao.status}`);
    console.log(`Preço: ${operacao.preco}`);
    console.log(`Quantidade: ${operacao.quantidade}`);
    console.log(`Valor Total: ${operacao.valorTotal}`);
    console.log(`Preço Fechamento: ${operacao.precoFechamento}`);
    console.log(`Resultado Total Atual: ${operacao.resultadoTotal}`);
    
    // Calcular o resultado correto
    let novoResultado = operacao.resultadoTotal;
    
    // Se a operação estiver fechada, recalcular o resultado
    if (operacao.status === 'Fechada' && operacao.precoFechamento !== null) {
      // Para operações de compra: (precoFechamento - preco) * quantidade
      // Para operações de venda: (preco - precoFechamento) * quantidade
      if (operacao.direcao === 'COMPRA') {
        novoResultado = (operacao.precoFechamento - operacao.preco) * operacao.quantidade;
      } else { // VENDA
        novoResultado = (operacao.preco - operacao.precoFechamento) * operacao.quantidade;
      }
    }
    
    console.log(`Novo Resultado Calculado: ${novoResultado}`);
    
    // Atualizar o resultado no banco de dados
    operacao.resultadoTotal = novoResultado;
    await operacao.save();
    
    console.log('------ APÓS A CORREÇÃO ------');
    console.log(`ID: ${operacao._id}`);
    console.log(`Código: ${operacao.idVisual}`);
    console.log(`Resultado Total Atualizado: ${operacao.resultadoTotal}`);
    console.log('Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao corrigir resultado da operação:', error);
  } finally {
    // Fechar a conexão com o banco
    if (mongoose.connection.readyState !== 0) {
      console.log('Fechando conexão...');
      await mongoose.connection.close();
    }
  }
}

// Executar a função de correção
await fixOperationResult();