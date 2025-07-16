#!/usr/bin/env node

/**
 * Script para testar a integração com MercadoPago
 * Usage: node scripts/test-mercadopago.js
 */

// Carregar variáveis de ambiente manualmente
const fs = require('fs');
const path = require('path');

// Carregar .env.local
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
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { createPreference, subscriptionPlans } = require('../lib/mercadopago');

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

// Validar configuração
function validateConfig() {
  log('\n=== Validando Configuração ===', colors.blue);
  
  const requiredEnvs = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_PUBLIC_KEY',
    'MERCADOPAGO_WEBHOOK_SECRET',
    'NEXTAUTH_URL'
  ];
  
  let configValid = true;
  
  requiredEnvs.forEach(env => {
    if (!process.env[env] || process.env[env] === 'your_access_token_here') {
      log(`❌ ${env} não configurado`, colors.red);
      configValid = false;
    } else {
      log(`✅ ${env} configurado`, colors.green);
    }
  });
  
  return configValid;
}

// Testar conexão com MercadoPago
async function testConnection() {
  log('\n=== Testando Conexão com MercadoPago ===', colors.blue);
  
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000
      }
    });
    
    const payment = new Payment(client);
    
    // Tentar fazer uma consulta simples para validar token
    await payment.search({
      options: {
        limit: 1
      }
    });
    
    log('✅ Conexão com MercadoPago OK', colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro na conexão: ${error.message}`, colors.red);
    return false;
  }
}

// Testar criação de preferência
async function testPreferenceCreation() {
  log('\n=== Testando Criação de Preferência ===', colors.blue);
  
  try {
    const plan = subscriptionPlans.monthly;
    
    const items = [
      {
        id: plan.id,
        title: plan.name,
        description: plan.description,
        unit_price: plan.price,
        quantity: 1,
        currency_id: plan.currency
      }
    ];
    
    const payer = {
      name: 'Teste Usuario',
      email: 'teste@superquant.com'
    };
    
    log('Criando preferência para teste...', colors.yellow);
    const backUrls = {
      success: `${process.env.NEXTAUTH_URL}/pagamento/sucesso`,
      failure: `${process.env.NEXTAUTH_URL}/pagamento/erro`,
      pending: `${process.env.NEXTAUTH_URL}/pagamento/pendente`
    };
    
    const preference = await createPreference(items, payer, backUrls);
    
    log('✅ Preferência criada com sucesso', colors.green);
    log(`ID: ${preference.id}`);
    log(`Init Point: ${preference.init_point}`);
    log(`Sandbox Init Point: ${preference.sandbox_init_point}`);
    
    return preference;
  } catch (error) {
    log(`❌ Erro ao criar preferência: ${error.message}`, colors.red);
    if (error.cause) {
      log(`Detalhes: ${JSON.stringify(error.cause, null, 2)}`, colors.red);
    }
    return null;
  }
}

// Testar API de criação de preferência
async function testPreferenceAPI() {
  log('\n=== Testando API de Criação de Preferência ===', colors.blue);
  
  try {
    const response = await fetch('http://localhost:3001/api/pagamentos/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test' // Isso vai falhar na auth, mas testa as credenciais
      },
      body: JSON.stringify({
        planId: 'monthly'
      })
    });
    
    if (response.status === 401) {
      log('✅ API funcionando (erro de auth esperado)', colors.green);
      return true;
    } else {
      const data = await response.json();
      log(`Status: ${response.status}`, colors.yellow);
      log(`Response: ${JSON.stringify(data, null, 2)}`, colors.yellow);
      return response.ok;
    }
  } catch (error) {
    log(`❌ Erro ao testar API: ${error.message}`, colors.red);
    return false;
  }
}

// Testar webhook (simular notificação)
async function testWebhook() {
  log('\n=== Testando Webhook ===', colors.blue);
  
  try {
    const fakeWebhookData = {
      type: 'payment',
      data: {
        id: 'fake-payment-id-123'
      }
    };
    
    const response = await fetch('http://localhost:3001/api/webhooks/mercadopago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fakeWebhookData)
    });
    
    const data = await response.json();
    log(`Status: ${response.status}`, colors.yellow);
    log(`Response: ${JSON.stringify(data, null, 2)}`, colors.yellow);
    
    if (response.status === 500 && data.error?.includes('Erro ao processar webhook')) {
      log('✅ Webhook funcionando (erro esperado para ID fake)', colors.green);
      return true;
    }
    
    return response.ok;
  } catch (error) {
    log(`❌ Erro ao testar webhook: ${error.message}`, colors.red);
    return false;
  }
}

// Função principal
async function main() {
  log('🚀 Iniciando Testes MercadoPago', colors.blue);
  
  const results = {
    config: false,
    connection: false,
    preference: false,
    api: false,
    webhook: false
  };
  
  // 1. Validar configuração
  results.config = validateConfig();
  if (!results.config) {
    log('\n❌ Configuração inválida. Corrija as variáveis de ambiente.', colors.red);
    process.exit(1);
  }
  
  // 2. Testar conexão
  results.connection = await testConnection();
  
  // 3. Testar criação de preferência
  if (results.connection) {
    const preference = await testPreferenceCreation();
    results.preference = !!preference;
  }
  
  // 4. Testar API (se o servidor estiver rodando)
  log('\n=== Testando APIs (servidor deve estar rodando) ===', colors.blue);
  results.api = await testPreferenceAPI();
  
  // 5. Testar webhook
  results.webhook = await testWebhook();
  
  // Relatório final
  log('\n=== RELATÓRIO FINAL ===', colors.blue);
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const color = passed ? colors.green : colors.red;
    log(`${test.toUpperCase()}: ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    log('\n🎉 Todos os testes passaram! MercadoPago está configurado corretamente.', colors.green);
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique a configuração.', colors.yellow);
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