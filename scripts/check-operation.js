// scripts/check-operation.js
import { connectToDatabase } from '../lib/db/mongodb.js';
import mongoose from 'mongoose';
import Operacao from '../lib/models/Operacao.js';

// Função para buscar a operação por código
async function findOperationByCode(codigo) {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Buscar a operação pelo código
    const operacao = await Operacao.findOne({ idVisual: codigo });
    
    if (!operacao) {
      console.log(`Operação com código ${codigo} não encontrada.`);
      return null;
    }
    
    // Calcular o valor total esperado para validação
    const valorTotalEsperado = operacao.preco * operacao.quantidade;
    console.log('------ DETALHES DA OPERAÇÃO ------');
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
    // Verificar se o mongoose está conectado antes de tentar fechar
    if (mongoose.connection.readyState !== 0) {
      console.log('Fechando conexão...');
      await mongoose.connection.close();
    }
  }
}

// Chamar a função com o código da operação informado
await findOperationByCode('op-6856');