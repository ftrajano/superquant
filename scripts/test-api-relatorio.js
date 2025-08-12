#!/usr/bin/env node

// Script para testar a API de relatórios diretamente
// Uso: node scripts/test-api-relatorio.js

const https = require('https');
const querystring = require('querystring');

async function testApiRelatorio() {
  try {
    console.log('🔍 TESTANDO API DE RELATÓRIOS DIRETAMENTE');
    console.log('=========================================');

    // Simular uma requisição para a API
    const url = 'http://localhost:3000/api/relatorios?periodo=ultimos3meses';
    
    console.log(`📡 Fazendo requisição para: ${url}`);
    
    // Nota: Este script precisa ser executado com o servidor rodando
    // E com uma sessão válida, o que é complexo de simular
    
    console.log('⚠️  Para testar a API, você precisa:');
    console.log('1. Ter o servidor rodando (npm run dev)');
    console.log('2. Estar logado no navegador');
    console.log('3. Abrir o DevTools');
    console.log('4. Ir para a aba Network');
    console.log('5. Acessar a página de relatórios');
    console.log('6. Ver a requisição para /api/relatorios');
    
    console.log('\n🔧 ALTERNATIVA: Vamos adicionar logs na API');
    console.log('============================================');
    
    console.log('Vou modificar a API para adicionar logs detalhados...');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testApiRelatorio();