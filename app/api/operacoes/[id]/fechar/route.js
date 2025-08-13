// app/api/operacoes/[id]/fechar/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifyOperacaoFechamento } from '@/lib/telegram';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { precoFechamento, quantidadeFechar } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }
    
    if (precoFechamento === undefined || precoFechamento === null || isNaN(parseFloat(precoFechamento))) {
      return NextResponse.json(
        { error: 'Preco de fechamento obrigatorio e deve ser um numero valido' },
        { status: 400 }
      );
    }
    
    // Validar quantidade a fechar (se fornecida)
    let quantidadeParaFechar = null;
    if (quantidadeFechar !== undefined) {
      quantidadeParaFechar = parseInt(quantidadeFechar);
      if (isNaN(quantidadeParaFechar) || quantidadeParaFechar <= 0) {
        return NextResponse.json(
          { error: 'Quantidade a fechar deve ser um número positivo' },
          { status: 400 }
        );
      }
    }
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const operacao = await Operacao.findById(id);
    
    if (!operacao) {
      return NextResponse.json(
        { error: 'Operacao nao encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é dono da operação
    if (operacao.userId && operacao.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }
    
    // Obter a quantidade total da operação e a quantidade já fechada
    // Para operações parcialmente fechadas, precisamos usar a quantidade original
    const quantidadeOriginal = operacao.quantidadeOriginal || operacao.quantidade || 1;
    const quantidadeJaFechada = operacao.quantidadeFechada || 0;
    const quantidadeDisponivel = quantidadeOriginal - quantidadeJaFechada;
    
    // Se não foi especificada uma quantidade, fechar toda a operação restante
    if (quantidadeParaFechar === null) {
      quantidadeParaFechar = quantidadeDisponivel;
    }
    
    // Verificar se a quantidade a fechar é maior que a disponível
    if (quantidadeParaFechar > quantidadeDisponivel) {
      return NextResponse.json(
        { error: `Não é possível fechar ${quantidadeParaFechar} unidades, pois a operação possui apenas ${quantidadeDisponivel} disponíveis` },
        { status: 400 }
      );
    }
    
    // Verificar se estamos tentando fechar uma quantidade zero
    if (quantidadeParaFechar <= 0) {
      return NextResponse.json(
        { error: 'A quantidade a fechar deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    // Calcular resultado por unidade
    let resultadoPorUnidade = 0;
    if (operacao.direcao === 'COMPRA') {
      resultadoPorUnidade = parseFloat(precoFechamento) - operacao.preco;
    } else {
      resultadoPorUnidade = operacao.preco - parseFloat(precoFechamento);
    }
    
    // Determinar se é fechamento total ou parcial
    // Para operações que já estão parcialmente fechadas, precisamos verificar
    // se estamos fechando o restante (fechamento total) ou apenas mais uma parte (fechamento parcial)
    const ehFechamentoTotal = quantidadeParaFechar >= quantidadeDisponivel;
    const ehFechamentoParcial = !ehFechamentoTotal;
    
    if (ehFechamentoParcial) {
      // FECHAMENTO PARCIAL
      
      // 1. Atualizar o status da operação original
      const quantidadeRestante = quantidadeDisponivel - quantidadeParaFechar;
      
      // Calcular resultados da parte que está sendo fechada
      const resultadoFechado = resultadoPorUnidade * quantidadeParaFechar;
      const valorAberturaFechado = operacao.preco * quantidadeParaFechar;
      const valorFechamentoFechado = parseFloat(precoFechamento) * quantidadeParaFechar;
      
      // 2. Criar uma nova operação para a parte fechada
      const novaOperacaoFechada = new Operacao({
        nome: operacao.nome,
        ticker: operacao.ticker,
        mesReferencia: operacao.mesReferencia,
        anoReferencia: operacao.anoReferencia,
        tipo: operacao.tipo,
        direcao: operacao.direcao,
        strike: operacao.strike,
        preco: operacao.preco,
        quantidade: quantidadeParaFechar,
        valorTotal: valorAberturaFechado,
        dataAbertura: operacao.dataAbertura,
        status: 'Fechada',
        dataFechamento: new Date(new Date().toISOString().split('T')[0] + 'T12:00:00Z'),
        precoFechamento: parseFloat(precoFechamento),
        valorTotalFechamento: valorFechamentoFechado,
        resultadoTotal: resultadoFechado,
        observacoes: `${operacao.observacoes || ''} [Fechamento parcial de ${operacao._id}]`,
        userId: operacao.userId,
        operacaoOriginalId: operacao._id
      });
      
      // Salvar a nova operação fechada
      await novaOperacaoFechada.save();
      
      // 3. Atualizar a operação original
      const operacaoAtualizada = await Operacao.findByIdAndUpdate(
        id,
        { 
          $set: {
            // Manter a quantidade original para consistência
            quantidadeOriginal: operacao.quantidadeOriginal || operacao.quantidade,
            quantidade: quantidadeRestante,
            valorTotal: operacao.preco * quantidadeRestante,
            status: 'Parcialmente Fechada',
            quantidadeFechada: (operacao.quantidadeFechada || 0) + quantidadeParaFechar
          },
          $push: {
            operacoesRelacionadas: novaOperacaoFechada._id
          }
        },
        { new: true, runValidators: true }
      );
      
      // Enviar notificação do Telegram para usuários modelo
      try {
        const usuario = await User.findById(session.user.id);
        if (usuario && usuario.role === 'modelo') {
          console.log('🤖 TELEGRAM DEBUG: Enviando notificação de fechamento parcial para o Telegram...');
          console.log('🤖 TELEGRAM DEBUG: Usuário modelo encontrado:', { id: usuario._id, name: usuario.name, email: usuario.email });
          console.log('🤖 TELEGRAM DEBUG: Dados da operação fechada:', { idVisual: novaOperacaoFechada.idVisual, ticker: novaOperacaoFechada.ticker, resultado: novaOperacaoFechada.resultadoTotal });
          
          const telegramResult = await notifyOperacaoFechamento(novaOperacaoFechada);
          
          if (telegramResult) {
            console.log('🤖 TELEGRAM DEBUG: ✅ Notificação de fechamento parcial enviada com sucesso');
          } else {
            console.log('🤖 TELEGRAM DEBUG: ❌ Falha ao enviar notificação de fechamento parcial');
          }
        } else {
          console.log('🤖 TELEGRAM DEBUG: Usuário não é modelo, não enviando notificação de fechamento parcial');
          console.log('🤖 TELEGRAM DEBUG: Dados do usuário:', usuario ? { id: usuario._id, name: usuario.name, email: usuario.email, role: usuario.role } : 'Usuário não encontrado');
        }
      } catch (telegramError) {
        console.error('🤖 TELEGRAM DEBUG: ❌ Erro ao enviar notificação do Telegram:', telegramError);
        // Não falhar a operação principal por causa do Telegram
      }
      
      // Retornar ambas as operações
      return NextResponse.json({
        operacaoOriginal: operacaoAtualizada,
        operacaoFechada: novaOperacaoFechada,
        mensagem: `Fechamento parcial: ${quantidadeParaFechar} de ${quantidadeOriginal} unidades fechadas com sucesso`
      });
      
    } else {
      // FECHAMENTO TOTAL (ou do restante disponível)
      
      // Calcular resultados para a parte disponível da operação
      const resultadoTotal = resultadoPorUnidade * quantidadeDisponivel;
      const valorTotalAbertura = operacao.preco * quantidadeDisponivel;
      const valorTotalFechamento = parseFloat(precoFechamento) * quantidadeDisponivel;
      
      // Atualizar a operação como fechada
      const operacaoAtualizada = await Operacao.findByIdAndUpdate(
        id,
        { 
          $set: {
            status: 'Fechada',
            dataFechamento: new Date(new Date().toISOString().split('T')[0] + 'T12:00:00Z'),
            precoFechamento: parseFloat(precoFechamento),
            valorTotal: valorTotalAbertura,
            valorTotalFechamento: valorTotalFechamento,
            resultadoTotal: resultadoTotal,
            quantidadeFechada: quantidadeOriginal
          } 
        },
        { new: true, runValidators: true }
      );
      
      // Enviar notificação do Telegram para usuários modelo
      try {
        const usuario = await User.findById(session.user.id);
        if (usuario && usuario.role === 'modelo') {
          console.log('🤖 TELEGRAM DEBUG: Enviando notificação de fechamento total para o Telegram...');
          console.log('🤖 TELEGRAM DEBUG: Usuário modelo encontrado:', { id: usuario._id, name: usuario.name, email: usuario.email });
          console.log('🤖 TELEGRAM DEBUG: Dados da operação fechada:', { idVisual: operacaoAtualizada.idVisual, ticker: operacaoAtualizada.ticker, resultado: operacaoAtualizada.resultadoTotal });
          
          const telegramResult = await notifyOperacaoFechamento(operacaoAtualizada);
          
          if (telegramResult) {
            console.log('🤖 TELEGRAM DEBUG: ✅ Notificação de fechamento total enviada com sucesso');
          } else {
            console.log('🤖 TELEGRAM DEBUG: ❌ Falha ao enviar notificação de fechamento total');
          }
        } else {
          console.log('🤖 TELEGRAM DEBUG: Usuário não é modelo, não enviando notificação de fechamento total');
          console.log('🤖 TELEGRAM DEBUG: Dados do usuário:', usuario ? { id: usuario._id, name: usuario.name, email: usuario.email, role: usuario.role } : 'Usuário não encontrado');
        }
      } catch (telegramError) {
        console.error('🤖 TELEGRAM DEBUG: ❌ Erro ao enviar notificação do Telegram:', telegramError);
        // Não falhar a operação principal por causa do Telegram
      }
      
      return NextResponse.json({
        operacaoFechada: operacaoAtualizada,
        mensagem: 'Operação fechada completamente com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao fechar operacao:', error);
    return NextResponse.json(
      { error: 'Erro ao fechar operacao' },
      { status: 500 }
    );
  }
}