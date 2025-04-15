// app/api/operacoes/[id]/fechar/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { precoFechamento } = await request.json();
    
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
    
    await connectToDatabase();
    
    const operacao = await Operacao.findById(id);
    
    if (!operacao) {
      return NextResponse.json(
        { error: 'Operacao nao encontrada' },
        { status: 404 }
      );
    }
    
    // Calcular resultado
    let resultado = 0;
    if (operacao.direcao === 'COMPRA') {
      resultado = parseFloat(precoFechamento) - operacao.preco;
    } else {
      resultado = operacao.preco - parseFloat(precoFechamento);
    }
    
    const operacaoAtualizada = await Operacao.findByIdAndUpdate(
      id,
      { 
        $set: {
          status: 'Fechada',
          dataFechamento: new Date(),
          precoFechamento: parseFloat(precoFechamento),
          resultadoTotal: resultado
        } 
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(operacaoAtualizada);
  } catch (error) {
    console.error('Erro ao fechar operacao:', error);
    return NextResponse.json(
      { error: 'Erro ao fechar operacao' },
      { status: 500 }
    );
  }
}