// app/api/margem/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função auxiliar para formatar operações com margem para exibição
const formatarOperacoesParaExibicao = (operacoes) => {
  return operacoes
    .filter(op => op.margemUtilizada && op.margemUtilizada > 0) // Apenas operações com margem definida
    .map(op => {
      let valorMargem = 0;

      if (op.margemUtilizada && op.margemUtilizada > 0) {
        // Calcular o valor da margem considerando o status da operação
        let margemAjustada = 0;

        if (op.status === 'Parcialmente Fechada') {
          const qtdTotal = op.quantidade || 1;
          const qtdRestante = qtdTotal - (op.quantidadeFechada || 0);
          // Calcular margem proporcional à quantidade restante
          margemAjustada = (op.margemUtilizada * qtdRestante) / qtdTotal;
        } else {
          // Se está totalmente aberta, usar o valor completo de margem
          margemAjustada = op.margemUtilizada;
        }

        // Ajustar o valor da margem com base na direção
        if (op.direcao === 'COMPRA') {
          // Ao comprar opções, adiciona valor à margem (positivo)
          valorMargem = margemAjustada;
        } else if (op.direcao === 'VENDA') {
          // Ao vender opções, subtrai valor da margem (negativo)
          valorMargem = -margemAjustada;
        }
      }

      return {
        id: op._id,
        ticker: op.ticker,
        tipo: op.tipo,
        direcao: op.direcao,
        status: op.status,
        quantidade: op.quantidade || 1,
        quantidadeRestante: op.status === 'Parcialmente Fechada'
          ? (op.quantidade || 1) - (op.quantidadeFechada || 0)
          : (op.quantidade || 1),
        dataAbertura: op.dataAbertura,
        valorMargem
      };
    });
};

// Função auxiliar para calcular a margem utilizada por operações abertas
const calcularMargemUtilizada = async (userId) => {
  const operacoesAbertas = await Operacao.find({
    userId,
    status: { $in: ['Aberta', 'Parcialmente Fechada'] }
  });

  let margemUtilizada = 0;

  operacoesAbertas.forEach(op => {
    // Usar o campo margemUtilizada explicitamente definido pelo usuário, se disponível
    if (op.margemUtilizada && op.margemUtilizada > 0) {
      // Determinar se a margem deve ser adicionada ou subtraída com base na direção
      const valorMargem = op.margemUtilizada;
      let margemAjustada = 0;

      // Se a operação está parcialmente fechada, calcular a margem proporcional
      if (op.status === 'Parcialmente Fechada') {
        const qtdTotal = op.quantidade || 1;
        const qtdRestante = qtdTotal - (op.quantidadeFechada || 0);
        // Calcular margem proporcional à quantidade restante
        margemAjustada = (valorMargem * qtdRestante) / qtdTotal;
      } else {
        // Se está totalmente aberta, usar o valor completo de margem
        margemAjustada = valorMargem;
      }

      // Ajustar com base na direção
      if (op.direcao === 'COMPRA') {
        // Ao comprar opções, adiciona valor à margem disponível
        margemUtilizada += margemAjustada;
      } else if (op.direcao === 'VENDA') {
        // Ao vender opções, subtrai valor da margem disponível
        margemUtilizada -= margemAjustada;
      }
    }
  });

  return margemUtilizada;
};

// GET - Buscar informações da margem do usuário
export async function GET(_request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Calcular margem utilizada pelas operações abertas
    const margemUtilizada = await calcularMargemUtilizada(userId);
    
    // Atualizar o valor da margem utilizada no perfil do usuário
    if (margemUtilizada !== user.margemUtilizada) {
      await User.findByIdAndUpdate(
        userId,
        { $set: { margemUtilizada } },
        { new: true }
      );
    }
    
    // Calcular a margem disponível
    const margemDisponivel = user.margemTotal - margemUtilizada;
    
    // Buscar operações abertas para detalhar o uso da margem
    const operacoesAbertas = await Operacao.find({
      userId,
      status: { $in: ['Aberta', 'Parcialmente Fechada'] }
    }).sort({ dataAbertura: -1 });
    
    // Formatar operações para exibição usando a função auxiliar
    const detalhesOperacoes = formatarOperacoesParaExibicao(operacoesAbertas);
    
    return NextResponse.json({
      margemTotal: user.margemTotal,
      margemUtilizada,
      margemDisponivel,
      detalhesOperacoes
    });
    
  } catch (error) {
    console.error('Erro ao buscar margem:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações de margem' },
      { status: 500 }
    );
  }
}

// POST - Atualizar margem (depósito, saque ou ajuste)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    const { tipo, valor, descricao } = await request.json();
    
    // Validar dados obrigatórios
    if (!tipo || !valor || isNaN(parseFloat(valor))) {
      return NextResponse.json(
        { error: 'Dados inválidos. Tipo e valor são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Tipos válidos de transação
    if (!['deposito', 'saque', 'ajuste', 'configuracao_inicial'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de transação inválido. Use: deposito, saque, ajuste ou configuracao_inicial.' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const userId = session.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Calcular margem utilizada atual
    const margemUtilizada = await calcularMargemUtilizada(userId);
    
    const valorNumerico = parseFloat(valor);
    let novaMargemTotal = user.margemTotal || 0;
    
    // Atualizar margem conforme o tipo de transação
    switch (tipo) {
      case 'deposito':
        novaMargemTotal += valorNumerico;
        break;
      case 'saque':
        // Verificar se há margem suficiente
        if (novaMargemTotal - valorNumerico < margemUtilizada) {
          return NextResponse.json(
            { error: 'Margem insuficiente para saque. Verifique suas operações abertas.' },
            { status: 400 }
          );
        }
        novaMargemTotal -= valorNumerico;
        break;
      case 'ajuste':
        // Ajuste direto no valor da margem (garantir que não seja menor que a margem utilizada)
        if (valorNumerico < margemUtilizada) {
          return NextResponse.json(
            { error: `Valor de ajuste insuficiente. Você precisa de pelo menos ${margemUtilizada} para cobrir suas operações abertas.` },
            { status: 400 }
          );
        }
        novaMargemTotal = valorNumerico;
        break;
      case 'configuracao_inicial':
        // Configuração inicial da margem (primeira configuração)
        if (user.margemTotal > 0) {
          return NextResponse.json(
            { error: 'Margem já configurada. Use depósito, saque ou ajuste para alterar.' },
            { status: 400 }
          );
        }
        novaMargemTotal = valorNumerico;
        break;
    }
    
    // Atualizar usuário - sem adicionar ao histórico
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { 
          margemTotal: novaMargemTotal,
          margemUtilizada
        }
      },
      { new: true }
    );
    
    // Calcular a margem disponível
    const margemDisponivel = updatedUser.margemTotal - margemUtilizada;
    
    // Buscar operações abertas para detalhar o uso da margem
    const operacoesAbertas = await Operacao.find({
      userId,
      status: { $in: ['Aberta', 'Parcialmente Fechada'] }
    }).sort({ dataAbertura: -1 });
    
    // Formatar operações para exibição usando a função auxiliar
    const detalhesOperacoes = formatarOperacoesParaExibicao(operacoesAbertas);
    
    return NextResponse.json({
      margemTotal: updatedUser.margemTotal,
      margemUtilizada,
      margemDisponivel,
      detalhesOperacoes
    });
    
  } catch (error) {
    console.error('Erro ao atualizar margem:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar informações de margem' },
      { status: 500 }
    );
  }
}
