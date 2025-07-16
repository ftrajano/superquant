#!/usr/bin/env node

/**
 * Script para testar o bot do Telegram
 */

const { sendTelegramMessage, notifyOperacaoAbertura, notifyOperacaoFechamento } = require('../lib/telegram');

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

// Teste 1: Mensagem simples
async function testSimpleMessage() {
  log('\n=== Teste 1: Mensagem Simples ===', colors.blue);
  
  try {
    const message = `🧪 <b>TESTE DO BOT TELEGRAM</b>

<b>Data:</b> ${new Date().toLocaleString('pt-BR')}
<b>Status:</b> ✅ Funcionando

Este é um teste automatizado do bot do Telegram do SuperQuant.

<i>Se você recebeu esta mensagem, o bot está funcionando corretamente!</i>`;

    const result = await sendTelegramMessage(message);
    
    if (result) {
      log('✅ Mensagem simples enviada com sucesso!', colors.green);
    } else {
      log('❌ Falha ao enviar mensagem simples', colors.red);
    }
    
    return result;
  } catch (error) {
    log(`❌ Erro no teste de mensagem simples: ${error.message}`, colors.red);
    return false;
  }
}

// Teste 2: Notificação de abertura de operação
async function testOperacaoAbertura() {
  log('\n=== Teste 2: Notificação de Abertura ===', colors.blue);
  
  try {
    const operacaoTeste = {
      idVisual: 'TEST001',
      ticker: 'PETR4',
      tipo: 'CALL',
      direcao: 'COMPRA',
      strike: 25.50,
      preco: 2.75,
      quantidade: 100,
      valorTotal: 275.00,
      observacoes: 'Teste de abertura de operação - SuperQuant Bot'
    };

    const result = await notifyOperacaoAbertura(operacaoTeste);
    
    if (result) {
      log('✅ Notificação de abertura enviada com sucesso!', colors.green);
    } else {
      log('❌ Falha ao enviar notificação de abertura', colors.red);
    }
    
    return result;
  } catch (error) {
    log(`❌ Erro no teste de abertura: ${error.message}`, colors.red);
    return false;
  }
}

// Teste 3: Notificação de fechamento de operação
async function testOperacaoFechamento() {
  log('\n=== Teste 3: Notificação de Fechamento ===', colors.blue);
  
  try {
    const operacaoTeste = {
      idVisual: 'TEST001',
      ticker: 'PETR4',
      tipo: 'CALL',
      direcao: 'COMPRA',
      strike: 25.50,
      preco: 2.75,
      precoFechamento: 3.25,
      quantidade: 100,
      resultadoTotal: 50.00,
      observacoes: 'Teste de fechamento de operação - SuperQuant Bot'
    };

    const result = await notifyOperacaoFechamento(operacaoTeste);
    
    if (result) {
      log('✅ Notificação de fechamento enviada com sucesso!', colors.green);
    } else {
      log('❌ Falha ao enviar notificação de fechamento', colors.red);
    }
    
    return result;
  } catch (error) {
    log(`❌ Erro no teste de fechamento: ${error.message}`, colors.red);
    return false;
  }
}

// Teste 4: Verificar configuração
async function testConfiguration() {
  log('\n=== Teste 4: Verificação de Configuração ===', colors.blue);
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Verificar se .env.local existe
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log('❌ Arquivo .env.local não encontrado', colors.red);
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar TELEGRAM_BOT_TOKEN
    const botTokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    if (!botTokenMatch) {
      log('❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local', colors.red);
      return false;
    }
    
    const botToken = botTokenMatch[1].trim();
    if (!botToken || botToken === 'your_token_here') {
      log('❌ TELEGRAM_BOT_TOKEN não configurado corretamente', colors.red);
      return false;
    }
    
    // Verificar TELEGRAM_CHAT_ID
    const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID=(.+)/);
    if (!chatIdMatch) {
      log('❌ TELEGRAM_CHAT_ID não encontrado no .env.local', colors.red);
      return false;
    }
    
    const chatId = chatIdMatch[1].trim();
    if (!chatId || chatId === 'your_chat_id_here') {
      log('❌ TELEGRAM_CHAT_ID não configurado corretamente', colors.red);
      return false;
    }
    
    log('✅ Configuração do Telegram OK', colors.green);
    log(`Token: ${botToken.substring(0, 10)}...`, colors.yellow);
    log(`Chat ID: ${chatId}`, colors.yellow);
    
    return true;
  } catch (error) {
    log(`❌ Erro na verificação de configuração: ${error.message}`, colors.red);
    return false;
  }
}

// Teste 5: Testar API do Telegram diretamente
async function testTelegramAPI() {
  log('\n=== Teste 5: API do Telegram ===', colors.blue);
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const botTokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    if (!botTokenMatch) {
      log('❌ Token não encontrado', colors.red);
      return false;
    }
    
    const botToken = botTokenMatch[1].trim();
    const url = `https://api.telegram.org/bot${botToken}/getMe`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      log(`❌ Erro na API do Telegram: ${response.status}`, colors.red);
      return false;
    }
    
    const data = await response.json();
    
    if (data.ok) {
      log('✅ Bot do Telegram ativo!', colors.green);
      log(`Nome: ${data.result.username}`, colors.yellow);
      log(`ID: ${data.result.id}`, colors.yellow);
      return true;
    } else {
      log(`❌ Resposta da API: ${data.description}`, colors.red);
      return false;
    }
    
  } catch (error) {
    log(`❌ Erro no teste da API: ${error.message}`, colors.red);
    return false;
  }
}

// Função principal
async function main() {
  log('🤖 Iniciando Testes do Bot do Telegram', colors.blue);
  
  const results = {
    configuration: false,
    telegramAPI: false,
    simpleMessage: false,
    operacaoAbertura: false,
    operacaoFechamento: false
  };
  
  // 1. Verificar configuração
  results.configuration = await testConfiguration();
  
  // 2. Testar API do Telegram
  if (results.configuration) {
    results.telegramAPI = await testTelegramAPI();
  }
  
  // 3. Testar mensagem simples
  if (results.telegramAPI) {
    results.simpleMessage = await testSimpleMessage();
    
    // Aguardar um pouco entre mensagens
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 4. Testar notificação de abertura
  if (results.simpleMessage) {
    results.operacaoAbertura = await testOperacaoAbertura();
    
    // Aguardar um pouco entre mensagens
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 5. Testar notificação de fechamento
  if (results.operacaoAbertura) {
    results.operacaoFechamento = await testOperacaoFechamento();
  }
  
  // Relatório final
  log('\n=== RELATÓRIO FINAL ===', colors.blue);
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const color = passed ? colors.green : colors.red;
    log(`${test.toUpperCase()}: ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    log('\n🎉 Todos os testes passaram! Bot do Telegram funcionando perfeitamente.', colors.green);
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique a configuração do bot.', colors.yellow);
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { main };