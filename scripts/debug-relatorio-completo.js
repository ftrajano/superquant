#!/usr/bin/env node

// Script de debug completo para investigar todas as operações do usuário
// Uso: MONGODB_URI="sua-uri" node scripts/debug-relatorio-completo.js

const mongoose = require('mongoose');

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

const Operacao = mongoose.model('Operacao', OperacaoSchema, 'operacoes');

async function debugCompleto(userEmail) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    console.log('\n🔍 DEBUG COMPLETO: TODAS AS OPERAÇÕES');
    console.log('====================================');

    // Buscar usuário
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String
    }, { timestamps: true });
    const User = mongoose.model('User', UserSchema, 'users');

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`✅ Usuário: ${user.name} (ID: ${user._id})`);
    const userId = user._id.toString();

    // 1. Buscar TODAS as operações do usuário
    console.log('\n📊 TODAS AS OPERAÇÕES DO USUÁRIO:');
    console.log('=================================');

    const todasOperacoes = await Operacao.find({ userId: userId })
      .sort({ dataAbertura: -1 })
      .lean();

    console.log(`Total de operações: ${todasOperacoes.length}`);

    if (todasOperacoes.length === 0) {
      console.log('❌ Nenhuma operação encontrada para este usuário');
      return;
    }

    // 2. Agrupar por status
    const operacoesPorStatus = {};
    todasOperacoes.forEach(op => {
      const status = op.status || 'Sem Status';
      if (!operacoesPorStatus[status]) {
        operacoesPorStatus[status] = [];
      }
      operacoesPorStatus[status].push(op);
    });

    console.log('\n📈 DISTRIBUIÇÃO POR STATUS:');
    console.log('===========================');
    Object.keys(operacoesPorStatus).forEach(status => {
      console.log(`${status}: ${operacoesPorStatus[status].length} operações`);
    });

    // 3. Mostrar operações fechadas com detalhes
    const operacoesFechadas = todasOperacoes.filter(op => op.status === 'Fechada');
    console.log(`\n💰 OPERAÇÕES FECHADAS (${operacoesFechadas.length}):`);
    console.log('==========================');

    let somaTotal = 0;
    operacoesFechadas.forEach((op, index) => {
      const resultado = op.resultadoTotal || 0;
      somaTotal += resultado;
      
      console.log(`${index + 1}. ${op.idVisual || op._id}`);
      console.log(`   Ticker: ${op.ticker || 'N/A'}`);
      console.log(`   Resultado: R$ ${resultado}`);
      console.log(`   Data Abertura: ${op.dataAbertura ? op.dataAbertura.toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   Data Fechamento: ${op.dataFechamento ? op.dataFechamento.toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   MesRef: ${op.mesReferencia || 'N/A'} / AnoRef: ${op.anoReferencia || 'N/A'}`);
      console.log(`   Acumulado: R$ ${somaTotal}`);
      console.log('');
    });

    console.log(`🎯 SOMA TOTAL DAS OPERAÇÕES FECHADAS: R$ ${somaTotal}`);

    // 4. Verificar se -318 aparece em algum lugar
    console.log('\n🔍 PROCURANDO VALOR -318:');
    console.log('=========================');

    const operacoesCom318 = todasOperacoes.filter(op => 
      op.resultadoTotal === -318 || 
      op.valorTotal === -318 || 
      op.preco === -318
    );

    if (operacoesCom318.length > 0) {
      console.log(`✅ Encontradas ${operacoesCom318.length} operações com valor -318:`);
      operacoesCom318.forEach(op => {
        console.log(`   - ${op.idVisual}: ${op.ticker} - Resultado: R$ ${op.resultadoTotal}`);
      });
    } else {
      console.log('❌ Nenhuma operação individual com valor -318 encontrada');
    }

    // 5. Verificar operações com fechamento parcial
    const operacoesComOriginal = todasOperacoes.filter(op => op.operacaoOriginalId);
    console.log(`\n🔄 OPERAÇÕES DE FECHAMENTO PARCIAL: ${operacoesComOriginal.length}`);
    
    if (operacoesComOriginal.length > 0) {
      let somaFechamentoParcial = 0;
      operacoesComOriginal.forEach(op => {
        somaFechamentoParcial += (op.resultadoTotal || 0);
        console.log(`   - ${op.idVisual}: R$ ${op.resultadoTotal} (Origem: ${op.operacaoOriginalId})`);
      });
      console.log(`   Total Fechamento Parcial: R$ ${somaFechamentoParcial}`);
    }

    // 6. Testar diferentes períodos
    console.log('\n📅 TESTANDO DIFERENTES PERÍODOS:');
    console.log('================================');

    const hoje = new Date();
    
    // Últimos 30 dias
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(hoje.getDate() - 30);
    
    const operacoesUltimos30 = todasOperacoes.filter(op => {
      return op.dataFechamento && 
             op.dataFechamento >= tresDiasAtras && 
             op.dataFechamento <= hoje &&
             op.status === 'Fechada';
    });
    
    const somaUltimos30 = operacoesUltimos30.reduce((sum, op) => sum + (op.resultadoTotal || 0), 0);
    console.log(`Últimos 30 dias: ${operacoesUltimos30.length} operações = R$ ${somaUltimos30}`);

    // Últimos 90 dias  
    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(hoje.getDate() - 90);
    
    const operacoesUltimos90 = todasOperacoes.filter(op => {
      return op.dataFechamento && 
             op.dataFechamento >= noventaDiasAtras && 
             op.dataFechamento <= hoje &&
             op.status === 'Fechada';
    });
    
    const somaUltimos90 = operacoesUltimos90.reduce((sum, op) => sum + (op.resultadoTotal || 0), 0);
    console.log(`Últimos 90 dias: ${operacoesUltimos90.length} operações = R$ ${somaUltimos90}`);

    // Todo período
    const somaTudo = operacoesFechadas.reduce((sum, op) => sum + (op.resultadoTotal || 0), 0);
    console.log(`Todas as operações fechadas: ${operacoesFechadas.length} = R$ ${somaTudo}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

const userEmail = process.argv[2];

if (!userEmail) {
  console.log('❌ Por favor, forneça o email do usuário');
  console.log('Uso: MONGODB_URI="sua-uri" node scripts/debug-relatorio-completo.js email@exemplo.com');
  process.exit(1);
}

debugCompleto(userEmail);