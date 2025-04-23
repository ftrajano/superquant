// app/api/migrate/route.js
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Verificar qual tipo de migração executar
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo') || 'all';
    
    const resultados = {
      campos_atualizados: [],
      total_atualizados: 0
    };
    
    // Migração de ano referência
    if (tipo === 'all' || tipo === 'ano') {
      // Buscar todas as operações que não têm anoReferencia
      const operacoesSemAno = await Operacao.find({ anoReferencia: { $exists: false } });
      console.log(`Encontradas ${operacoesSemAno.length} operações sem o campo anoReferencia`);
      
      // Atualizar cada operação com o ano atual
      const anoAtual = new Date().getFullYear();
      for (const op of operacoesSemAno) {
        await Operacao.updateOne(
          { _id: op._id },
          { $set: { anoReferencia: anoAtual } }
        );
      }
      
      resultados.campos_atualizados.push("anoReferencia");
      resultados.operacoesSemAno = operacoesSemAno.length;
      resultados.total_atualizados += operacoesSemAno.length;
      
      console.log(`Migração de anoReferencia concluída. ${operacoesSemAno.length} operações atualizadas.`);
    }
    
    // Migração de IDs visuais
    if (tipo === 'all' || tipo === 'idvisual') {
      // Buscar todas as operações que precisam ser migradas
      const operacoesSemIdVisual = await Operacao.find({ idVisual: { $exists: false } });
      
      // Migrate ID Visual
      for (const operacao of operacoesSemIdVisual) {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const idVisual = `OP-${randomId}`;
        
        await Operacao.updateOne(
          { _id: operacao._id },
          { $set: { idVisual: idVisual } }
        );
      }
      
      resultados.campos_atualizados.push("idVisual");
      resultados.operacoesSemIdVisual = operacoesSemIdVisual.length;
      resultados.total_atualizados += operacoesSemIdVisual.length;
    }
    
    // Migração de Ticker
    if (tipo === 'all' || tipo === 'ticker') {
      const operacoesSemTicker = await Operacao.find({ ticker: { $exists: false } });
      
      // Migrate Ticker
      for (const operacao of operacoesSemTicker) {
        // Usar o nome como ticker se disponível
        let ticker = operacao.nome || `Operação ${operacao._id.toString().slice(-4)}`;
        
        await Operacao.updateOne(
          { _id: operacao._id },
          { $set: { ticker: ticker } }
        );
      }
      
      resultados.campos_atualizados.push("ticker");
      resultados.operacoesSemTicker = operacoesSemTicker.length;
      resultados.total_atualizados += operacoesSemTicker.length;
    }
    
    // Migração de userId
    if (tipo === 'all' || tipo === 'userId') {
      // Obter sessão do usuário para verificar se é admin
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'admin') {
        console.log('Migração de userId restrita a admins');
        
        resultados.userId = {
          status: 'Ignorado',
          motivo: 'Migração de userId disponível apenas para administradores'
        };
      } else {
        const operacoesSemUserId = await Operacao.find({ userId: { $exists: false } });
        console.log(`Encontradas ${operacoesSemUserId.length} operações sem userId`);
        
        if (operacoesSemUserId.length > 0) {
          // Obter o primeiro usuário admin para atribuir às operações existentes
          const adminUser = await User.findOne({ role: 'admin' });
          
          if (adminUser) {
            // Atribuir userId para cada operação
            for (const operacao of operacoesSemUserId) {
              await Operacao.updateOne(
                { _id: operacao._id },
                { $set: { userId: adminUser._id } }
              );
            }
            
            resultados.campos_atualizados.push("userId");
            resultados.operacoesSemUserId = operacoesSemUserId.length;
            resultados.total_atualizados += operacoesSemUserId.length;
            resultados.adminUserId = adminUser._id.toString();
          } else {
            resultados.userId = {
              status: 'Falha',
              motivo: 'Nenhum usuário admin encontrado para atribuir às operações'
            };
          }
        } else {
          resultados.userId = {
            status: 'OK',
            motivo: 'Nenhuma operação sem userId encontrada'
          };
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migração concluída com sucesso. Total de ${resultados.total_atualizados} operações atualizadas.`,
      resultados
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json(
      { error: 'Erro na migração', message: error.message },
      { status: 500 }
    );
  }
}