import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para acessar este recurso.' },
        { status: 401 }
      );
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Parâmetro "symbol" é obrigatório' },
        { status: 400 }
      );
    }

    // Token de acesso para a API OpLab
    const accessToken = process.env.OPLAB_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token de acesso da API OpLab não configurado' },
        { status: 500 }
      );
    }
    
    const apiUrl = `https://api.oplab.com.br/v3/market/options/details/${symbol}`;

    // Fazer a solicitação para a API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Access-Token': accessToken
      },
    });

    // Tratar status 204 (No Content) - símbolo não encontrado
    if (response.status === 204) {
      return NextResponse.json(
        { error: 'Símbolo não encontrado ou sem dados disponíveis' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      // Se a API externa retornar erro, retransmitimos para o cliente
      const errorData = await response.json().catch(() => ({ message: 'Erro ao obter dados da API' }));
      return NextResponse.json(
        { error: errorData.message || `Erro da API: ${response.status}` },
        { status: response.status }
      );
    }

    // Processar os dados recebidos da API externa
    const data = await response.json();

    // Extrair os dados relevantes
    const optionDetails = {
      symbol: data.symbol || symbol,
      type: data.type,
      strike: data.strike,
      underlier: data.underlier,
      maturityDate: data.maturityDate,
      daysToMaturity: data.daysToMaturity,
      last: data.last,
      change: data.change,
      volume: data.volume,
      impliedVolatility: data.impliedVolatility * 100, // Converter para porcentagem
      delta: data.delta,
      greeks: {
        delta: data.delta,
        gamma: data.gamma,
        theta: data.theta,
        vega: data.vega,
        rho: data.rho
      }
    };

    // Retornar os dados processados
    return NextResponse.json(optionDetails);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}