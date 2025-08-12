#!/usr/bin/env node

// Script de debug para investigar o cálculo do relatório "Últimos 3 Meses"
// Uso: MONGODB_URI="sua-uri" node scripts/debug-relatorio.js

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

async function debugRelatorio(userEmail) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI não definida');
      return;
    }

    await mongoose.connect(mongoUri, { dbName: 'opcoes-app' });
    console.log('✅ Conectado ao MongoDB (database: opcoes-app)');

    // Simular o cálculo da API exatamente como está implementado

    console.log('\n🔍 DEBUG: RELATÓRIO ÚLTIMOS 3 MESES');
    console.log('=====================================');

    // 1. Calcular intervalo de datas (mesmo código da API)
    const hoje = new Date();
    let dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - 3);
    let dataFim = hoje;

    console.log(`📅 Período: ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`);

    // 2. Buscar usuário pelo email
    console.log(`\n👤 Buscando usuário: ${userEmail}`);
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

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user._id})`);
    const userId = user._id.toString();

    // 3. Query exata da API para operações fechadas
    let queryOperacoesFechadas = { 
      userId: userId,
      $or: [
        {
          userId: userId,
          dataFechamento: { $gte: dataInicio, $lte: dataFim },
          status: 'Fechada'
        },
        {
          userId: userId,
          dataFechamento: { $gte: dataInicio, $lte: dataFim },
          operacaoOriginalId: { $ne: null }
        }
      ]
    };

    console.log('\n🔍 Query para operações fechadas:');
    console.log(JSON.stringify(queryOperacoesFechadas, null, 2));

    const operacoesFechadas = await Operacao.find(queryOperacoesFechadas)
      .sort({ dataFechamento: -1 })
      .lean();

    console.log(`\n📊 Total de operações encontradas: ${operacoesFechadas.length}`);

    if (operacoesFechadas.length === 0) {
      console.log('❌ Nenhuma operação encontrada no período');
      return;
    }

    // 4. Aplicar filtro para métricas (mesmo código da API)
    console.log('\n🔍 APLICANDO FILTRO PARA MÉTRICAS:');
    console.log('=================================');

    const operacoesParaMetricas = operacoesFechadas.filter(op => {
      console.log(`\n📋 Analisando operação ${op.idVisual || op._id}:`);
      console.log(`   - Ticker: ${op.ticker}`);
      console.log(`   - Status: ${op.status}`);
      console.log(`   - Resultado: R$ ${op.resultadoTotal}`);
      console.log(`   - Data Fechamento: ${op.dataFechamento}`);
      console.log(`   - OperacaoOriginalId: ${op.operacaoOriginalId || 'null'}`);
      console.log(`   - OperacoesRelacionadas: ${op.operacoesRelacionadas || 'null'}`);

      // Incluir operações de fechamento parcial (têm operacaoOriginalId)
      if (op.operacaoOriginalId) {
        console.log(`   ✅ INCLUÍDA: É fechamento parcial`);
        return true;
      }
      
      // Incluir operações fechadas normalmente (sem partes)
      if (op.status === 'Fechada' && (!op.operacoesRelacionadas || op.operacoesRelacionadas.length === 0)) {
        console.log(`   ✅ INCLUÍDA: Operação fechada normal`);
        return true;
      }
      
      console.log(`   ❌ EXCLUÍDA: Não atende aos critérios`);
      return false;
    });

    console.log(`\n📈 OPERAÇÕES PARA CÁLCULO FINAL: ${operacoesParaMetricas.length}`);

    // 5. Calcular resultado total (mesmo código da API)
    console.log('\n💰 CÁLCULO DO RESULTADO TOTAL:');
    console.log('==============================');

    let somaTotal = 0;
    operacoesParaMetricas.forEach((op, index) => {
      const valor = op && typeof op.resultadoTotal === 'number' ? op.resultadoTotal : 0;
      somaTotal += valor;
      
      console.log(`${index + 1}. ${op.idVisual || op._id} - ${op.ticker}: R$ ${valor} (Acumulado: R$ ${somaTotal})`);
    });

    console.log(`\n🎯 RESULTADO FINAL: R$ ${somaTotal}`);
    
    // 6. Verificar duplicatas potenciais
    console.log('\n🔍 VERIFICANDO DUPLICATAS POTENCIAIS:');
    console.log('=====================================');

    const operacoesParciais = operacoesParaMetricas.filter(op => op.operacaoOriginalId);
    const operacoesNormais = operacoesParaMetricas.filter(op => !op.operacaoOriginalId);

    console.log(`Operações de fechamento parcial: ${operacoesParciais.length}`);
    console.log(`Operações normais: ${operacoesNormais.length}`);

    if (operacoesParciais.length > 0) {
      console.log('\n📋 Operações de fechamento parcial:');
      operacoesParciais.forEach(op => {
        console.log(`   - ${op.idVisual}: R$ ${op.resultadoTotal} (Origem: ${op.operacaoOriginalId})`);
      });
    }

    // 7. Mostrar resumo detalhado
    console.log('\n📊 RESUMO DETALHADO:');
    console.log('====================');
    console.log(`Total de operações fechadas no período: ${operacoesFechadas.length}`);
    console.log(`Operações incluídas no cálculo: ${operacoesParaMetricas.length}`);
    console.log(`Resultado total calculado: R$ ${somaTotal}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Obter email dos argumentos
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('❌ Por favor, forneça o email do usuário como argumento');
  console.log('Uso: MONGODB_URI="sua-uri" node scripts/debug-relatorio.js email@exemplo.com');
  process.exit(1);
}

debugRelatorio(userEmail);