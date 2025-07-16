#!/usr/bin/env node

/**
 * Script para encontrar símbolos válidos na API do OpLab
 */

const accessToken = 'rcBq4SWZoVowKYNOpbShRiXxrnKei6bQUSNpuz3MQ0n0yraAaRif/SRXFio0HydW--okWg9cNmiL8Sh1f25fgH1g==--ZmIyMjA1NDg3MzU3MWU4ZjI0ZWE5NzA4NTlhOGFiNmY=';

// Símbolos comuns de opções para testar
const testSymbols = [
  // Opções de PETR4
  'PETR4J240', 'PETR4J250', 'PETR4J260',
  'PETR4A240', 'PETR4A250', 'PETR4A260',
  
  // Opções de VALE3
  'VALE3J240', 'VALE3J250', 'VALE3J260',
  'VALE3A240', 'VALE3A250', 'VALE3A260',
  
  // Opções de BBAS3
  'BBAS3J240', 'BBAS3J250', 'BBAS3J260',
  'BBAS3A240', 'BBAS3A250', 'BBAS3A260',
  
  // Opções de IBOV
  'IBOVJ240', 'IBOVJ250', 'IBOVJ260',
  'IBOVA240', 'IBOVA250', 'IBOVA260',
];

async function testSymbol(symbol) {
  try {
    const apiUrl = `https://api.oplab.com.br/v3/market/options/details/${symbol}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Access-Token': accessToken
      },
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return { symbol, status: 'success', data };
    } else if (response.status === 204) {
      return { symbol, status: 'no_data', message: 'Sem dados' };
    } else {
      return { symbol, status: 'error', code: response.status };
    }
  } catch (error) {
    return { symbol, status: 'error', message: error.message };
  }
}

async function main() {
  console.log('🔍 Testando símbolos na API do OpLab...\n');
  
  const results = [];
  
  for (const symbol of testSymbols) {
    console.log(`Testando ${symbol}...`);
    const result = await testSymbol(symbol);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ${symbol} - Dados encontrados!`);
    } else if (result.status === 'no_data') {
      console.log(`⚠️  ${symbol} - Sem dados`);
    } else {
      console.log(`❌ ${symbol} - Erro: ${result.message || result.code}`);
    }
    
    // Pequeno delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Resumo dos resultados:');
  console.log('============================');
  
  const successful = results.filter(r => r.status === 'success');
  const noData = results.filter(r => r.status === 'no_data');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`✅ Com dados: ${successful.length}`);
  console.log(`⚠️  Sem dados: ${noData.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Símbolos válidos encontrados:');
    successful.forEach(result => {
      console.log(`- ${result.symbol}`);
      if (result.data) {
        console.log(`  Tipo: ${result.data.type}, Strike: ${result.data.strike}, Vencimento: ${result.data.maturityDate}`);
      }
    });
  } else {
    console.log('\n⚠️  Nenhum símbolo válido encontrado. Possíveis problemas:');
    console.log('   - Token de acesso expirado');
    console.log('   - API fora do ar');
    console.log('   - Símbolos de teste desatualizados');
  }
}

main().catch(console.error);