import { NextResponse } from 'next/server';

// Token para a API do OpLab
const OPLAB_TOKEN = 'rcBq4SWZoVowKYNOpbShRiXxrnKei6bQUSNpuz3MQ0n0yraAaRif/SRXFio0HydW--okWg9cNmiL8Sh1f25fgH1g==--ZmIyMjA1NDg3MzU3MWU4ZjI0ZWE5NzA4NTlhOGFiNmY=';

export async function GET(request) {
  try {
    // Obter parâmetros da consulta
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'bova11';
    
    // Fazer requisição para a API com o token de autenticação correto
    const encodedToken = encodeURIComponent(OPLAB_TOKEN);
    const apiUrl = `https://api.oplab.com.br/v3/market/options/${symbol}?api_key=${encodedToken}`;
    
    console.log(`Buscando dados de opções para: ${symbol}`);
    console.log(`API URL: ${apiUrl}`);
    console.log(`Usando token: ${OPLAB_TOKEN.substring(0, 10)}...`);
    
    // Vamos tentar com o header access-token
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'access-token': OPLAB_TOKEN
      },
      cache: 'no-store' // Não armazenar em cache para sempre obter dados atualizados
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao buscar dados de opções: ${response.status} - ${errorText}`);
      console.error(`Headers usados: ${JSON.stringify({
        'Accept': 'application/json',
        'Authorization': `Bearer ${OPLAB_TOKEN}`
      })}`);
      
      // Tentar analisar o texto de erro para diagnóstico
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Resposta de erro estruturada:', errorJson);
      } catch (e) {
        // Erro não está em formato JSON
      }
      
      return NextResponse.json(
        { 
          error: `Erro ao buscar dados de opções: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Processar a resposta
    const data = await response.json();
    
    // Lista de colunas a serem mantidas (conforme solicitado)
    const columnsToKeep = [
      'symbol', 'name', 'open', 'high', 'low', 'close', 'volume',
      'financial_volume', 'trades', 'bid', 'ask', 'category',
      'due_date', 'maturity_type', 'strike', 'variation',
      'spot_price', 'days_to_maturity', 'bid_volume', 'ask_volume', 
      'type' // Mantendo type para permitir filtrar entre CALL e PUT
    ];
    
    // Filtrar apenas as colunas desejadas
    const processedData = data.map(option => {
      const filteredOption = {};
      columnsToKeep.forEach(column => {
        if (option.hasOwnProperty(column)) {
          filteredOption[column] = option[column];
        }
      });
      return filteredOption;
    });
    
    console.log(`Encontradas ${processedData.length} opções para ${symbol}`);
    
    return NextResponse.json({
      symbol,
      count: processedData.length,
      options: processedData
    });
  } catch (error) {
    console.error('Erro ao processar requisição de opções:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de opções', details: error.message },
      { status: 500 }
    );
  }
}