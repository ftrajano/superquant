// app/api/historico/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/db/mongodb';
import HistoricoOperacao from '../../../lib/models/HistoricoOperacao';
import User from '../../../lib/models/User';

export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Conectar ao banco
    await connectToDatabase();

    // Buscar usuários modelo (todos)
    const usuariosModelo = await User.find({ role: 'modelo' });
    
    if (usuariosModelo.length === 0) {
      return NextResponse.json({ error: 'Nenhum usuário modelo encontrado' }, { status: 404 });
    }

    // Obter parâmetros de busca
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') || '';
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');
    const limite = parseInt(searchParams.get('limite')) || 50;
    const pagina = parseInt(searchParams.get('pagina')) || 1;

    // Construir query de busca - usar os IDs dos usuários modelo já buscados
    const userIds = usuariosModelo.map(u => u._id.toString());
    
    let query = { userId: { $in: userIds } };
    
    if (busca) {
      query.nome = { $regex: busca, $options: 'i' };
    }
    
    if (mes) {
      query.mesReferencia = mes;
    }
    
    if (ano && !isNaN(parseInt(ano))) {
      query.anoReferencia = parseInt(ano);
    }

    // Buscar histórico com paginação
    const skip = (pagina - 1) * limite;
    
    const historico = await HistoricoOperacao.find(query)
      .sort({ dataOperacao: -1 })
      .skip(skip)
      .limit(limite)
      .lean();

    // Contar total de registros
    const total = await HistoricoOperacao.countDocuments(query);

    return NextResponse.json({
      historico,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      limite
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}