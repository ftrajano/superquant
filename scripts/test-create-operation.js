#!/usr/bin/env node

// Script para testar criação de operação diretamente
const fetch = require('node-fetch');

async function testCreateOperation() {
  try {
    console.log('🧪 Testando criação de operação via API...\n');

    const operacaoTeste = {
      nome: "TESTE BOT TELEGRAM",
      ticker: "TESTB24",
      mesReferencia: "agosto", 
      anoReferencia: 2025,
      tipo: "CALL",
      direcao: "COMPRA",
      strike: 25.00,
      preco: 2.50,
      quantidade: 100,
      observacoes: "Teste para verificar bot do Telegram"
    };

    console.log('📋 Dados da operação teste:');
    console.log(JSON.stringify(operacaoTeste, null, 2));

    // Tentar criar sem autenticação primeiro (deve falhar)
    console.log('\n🔍 Testando sem autenticação (deve falhar)...');
    const responseNoAuth = await fetch('http://localhost:3000/api/operacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operacaoTeste),
    });

    console.log(`Status: ${responseNoAuth.status}`);
    const dataNoAuth = await responseNoAuth.json();
    console.log('Resposta:', dataNoAuth);

    if (responseNoAuth.status === 401) {
      console.log('✅ Autenticação funcionando (como esperado)');
    } else {
      console.log('⚠️ Resposta inesperada para requisição sem autenticação');
    }

    // Verificar se a API está funcionando
    console.log('\n🔍 Testando endpoint básico da API...');
    const healthCheck = await fetch('http://localhost:3000/api/operacoes');
    console.log(`Status health check: ${healthCheck.status}`);
    
    if (healthCheck.status === 401) {
      console.log('✅ API de operações está funcionando (requer autenticação)');
    } else {
      const healthData = await healthCheck.json();
      console.log('Resposta health check:', healthData);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCreateOperation();