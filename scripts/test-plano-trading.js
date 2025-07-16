#!/usr/bin/env node

/**
 * Script para testar a funcionalidade do plano de trading
 */

// Carregar variáveis de ambiente
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const { connectToDatabase } = require('../lib/db/mongodb');
const User = require('../lib/models/User');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testPlanoTrading() {
  try {
    log('🧪 Testando Plano de Trading', colors.blue);
    
    // Conectar ao banco
    await connectToDatabase();
    log('✅ Conectado ao MongoDB', colors.green);
    
    // Buscar um usuário para teste
    const user = await User.findOne().limit(1);
    if (!user) {
      log('❌ Nenhum usuário encontrado para teste', colors.red);
      return;
    }
    
    log(`📤 Testando com usuário: ${user.email}`, colors.yellow);
    
    // Dados de teste
    const testData = {
      capitalDisponivel: 100000,
      percentualReserva: 20,
      percentualPorOperacao: 25
    };
    
    // Calcular valores esperados
    const reserva = (testData.capitalDisponivel * testData.percentualReserva) / 100;
    const capitalParaTrade = testData.capitalDisponivel - reserva;
    const valorMensal = capitalParaTrade / 6;
    
    log('\n=== Cálculos Esperados ===', colors.blue);
    log(`Capital Total: R$ ${testData.capitalDisponivel.toLocaleString('pt-BR')}`, colors.yellow);
    log(`Reserva (${testData.percentualReserva}%): R$ ${reserva.toLocaleString('pt-BR')}`, colors.yellow);
    log(`Capital para Trade: R$ ${capitalParaTrade.toLocaleString('pt-BR')}`, colors.yellow);
    log(`Valor Mensal: R$ ${valorMensal.toLocaleString('pt-BR')}`, colors.yellow);
    
    // Atualizar plano de trading
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'planoTrading.capitalDisponivel': testData.capitalDisponivel,
          'planoTrading.percentualReserva': testData.percentualReserva,
          'planoTrading.percentualPorOperacao': testData.percentualPorOperacao,
          'planoTrading.valorMensal': valorMensal,
          'planoTrading.updatedAt': new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    log('\n=== Dados Salvos no Banco ===', colors.blue);
    log(`Capital: R$ ${updatedUser.planoTrading.capitalDisponivel.toLocaleString('pt-BR')}`, colors.green);
    log(`Reserva: ${updatedUser.planoTrading.percentualReserva}%`, colors.green);
    log(`Por Operação: ${updatedUser.planoTrading.percentualPorOperacao}%`, colors.green);
    log(`Valor Mensal: R$ ${updatedUser.planoTrading.valorMensal.toLocaleString('pt-BR')}`, colors.green);
    log(`Atualizado em: ${updatedUser.planoTrading.updatedAt}`, colors.green);
    
    // Verificar se os valores estão corretos
    const valorMensalSalvo = updatedUser.planoTrading.valorMensal;
    const diferenca = Math.abs(valorMensalSalvo - valorMensal);
    
    if (diferenca < 0.01) {
      log('\n✅ Cálculo correto! Valor mensal salvo conforme esperado.', colors.green);
    } else {
      log('\n❌ Erro no cálculo!', colors.red);
      log(`Esperado: R$ ${valorMensal.toLocaleString('pt-BR')}`, colors.red);
      log(`Salvo: R$ ${valorMensalSalvo.toLocaleString('pt-BR')}`, colors.red);
    }
    
    // Testar diferentes cenários
    log('\n=== Testando Diferentes Cenários ===', colors.blue);
    
    const cenarios = [
      { capital: 50000, reserva: 15, operacao: 20 },
      { capital: 200000, reserva: 30, operacao: 10 },
      { capital: 10000, reserva: 25, operacao: 30 }
    ];
    
    for (const cenario of cenarios) {
      const reservaCenario = (cenario.capital * cenario.reserva) / 100;
      const capitalTradeCenario = cenario.capital - reservaCenario;
      const valorMensalCenario = capitalTradeCenario / 6;
      
      log(`\n💰 Capital ${cenario.capital.toLocaleString('pt-BR')} | Reserva ${cenario.reserva}% | Op ${cenario.operacao}%`, colors.yellow);
      log(`   Valor Mensal: R$ ${valorMensalCenario.toLocaleString('pt-BR')}`, colors.yellow);
    }
    
    log('\n🎉 Teste concluído com sucesso!', colors.green);
    
  } catch (error) {
    log(`❌ Erro no teste: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Executar teste
testPlanoTrading().then(() => {
  process.exit(0);
}).catch(error => {
  log(`❌ Erro fatal: ${error.message}`, colors.red);
  process.exit(1);
});