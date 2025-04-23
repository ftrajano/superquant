// app/api/diagnose/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Buscar todas as operações
    const operacoes = await Operacao.find().sort({ createdAt: -1 });
    
    // Verificar IDs visuais, anos e campos ausentes
    const diagnostico = operacoes.map(op => ({
      _id: op._id.toString(),
      idVisual: op.idVisual || "<<AUSENTE>>",
      ticker: op.ticker || "<<AUSENTE>>",
      nome: op.nome || "<<AUSENTE>>",
      mesReferencia: op.mesReferencia,
      anoReferencia: op.anoReferencia || "<<AUSENTE>>",
      tipo: op.tipo,
      direcao: op.direcao,
      status: op.status,
      dataAbertura: op.dataAbertura,
      dataFechamento: op.dataFechamento,
      userId: op.userId ? op.userId.toString() : "<<AUSENTE>>",
      temDataAbertura: !!op.dataAbertura,
      temTickerENome: !!(op.ticker && op.nome),
      temIdVisual: !!op.idVisual,
      temAnoReferencia: !!op.anoReferencia,
      temUserId: !!op.userId
    }));
    
    // Resumo de operações por ano (se disponível)
    const operacoesPorAno = {};
    operacoes.forEach(op => {
      if (op.anoReferencia) {
        const ano = op.anoReferencia.toString();
        operacoesPorAno[ano] = (operacoesPorAno[ano] || 0) + 1;
      }
    });
    
    // Resumo de operações por mês
    const operacoesPorMes = {};
    operacoes.forEach(op => {
      if (op.mesReferencia) {
        operacoesPorMes[op.mesReferencia] = (operacoesPorMes[op.mesReferencia] || 0) + 1;
      }
    });
    
    // Exibir resumo de campos que precisam de migração
    const resumo = {
      totalOperacoes: operacoes.length,
      operacoesSemIdVisual: operacoes.filter(op => !op.idVisual).length,
      operacoesSemTicker: operacoes.filter(op => !op.ticker).length,
      operacoesSemAnoReferencia: operacoes.filter(op => !op.anoReferencia).length,
      operacoesSemUserId: operacoes.filter(op => !op.userId).length,
      operacoesPorMes,
      operacoesPorAno
    };
    
    // Link para executar migração
    const linkMigracao = "/api/migrate?tipo=all";
    
    return NextResponse.json({
      resumo,
      linkMigracao,
      diagnostico
    });
  } catch (error) {
    console.error('Erro ao diagnosticar operações:', error);
    return NextResponse.json(
      { error: 'Erro ao diagnosticar operações', detalhes: error.message },
      { status: 500 }
    );
  }
}