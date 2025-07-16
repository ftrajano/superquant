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
    const irate = searchParams.get('irate') || '14.25'; // Taxa de juros padrão

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
    
    const apiUrl = `https://api.oplab.com.br/v3/market/options/bs?symbol=${symbol}&irate=${irate}`;

    // Fazer a solicitação para a API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Access-Token': accessToken
      },
    });

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

    // Retornar os dados do Black-Scholes
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}