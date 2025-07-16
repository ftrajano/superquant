#!/usr/bin/env node

/**
 * Script para testar a API do OpLab
 */

const accessToken = 'rcBq4SWZoVowKYNOpbShRiXxrnKei6bQUSNpuz3MQ0n0yraAaRif/SRXFio0HydW--okWg9cNmiL8Sh1f25fgH1g==--ZmIyMjA1NDg3MzU3MWU4ZjI0ZWE5NzA4NTlhOGFiNmY=';

async function testOpLabAPI() {
  console.log('🔍 Testando API do OpLab...');
  
  const symbol = 'PETR4'; // Símbolo de teste
  const apiUrl = `https://api.oplab.com.br/v3/market/options/details/${symbol}`;
  
  try {
    console.log(`📡 Fazendo requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Access-Token': accessToken
      },
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log(`📊 Headers da resposta:`, Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API: ${response.status}`);
      console.error(`❌ Resposta completa: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Testar também com um símbolo de opção real
async function testWithOptionSymbol() {
  console.log('\n🔍 Testando com símbolo de opção...');
  
  const symbol = 'PETR4C240'; // Exemplo de símbolo de opção
  const apiUrl = `https://api.oplab.com.br/v3/market/options/details/${symbol}`;
  
  try {
    console.log(`📡 Fazendo requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Access-Token': accessToken
      },
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API: ${response.status}`);
      console.error(`❌ Resposta: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Dados da opção recebidos:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

async function main() {
  await testOpLabAPI();
  await testWithOptionSymbol();
}

main().catch(console.error);