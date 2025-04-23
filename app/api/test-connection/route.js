// app/api/test-connection/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Operacao from '@/lib/models/Operacao';

export async function GET(request) {
  try {
    // Testar conexão com o MongoDB
    console.log('Testando conexão com o MongoDB...');
    await connectToDatabase();
    
    // Verificar se devemos listar todas as operações
    const { searchParams } = new URL(request.url);
    const listar = searchParams.get('listar') === 'true';
    
    if (listar) {
      // Listar todas as operações sem filtros
      const operacoes = await Operacao.find().sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        message: "Listagem de todas as operações",
        totalOperacoes: operacoes.length,
        operacoes: operacoes
      });
    }
    
    // Testar criação de operação
    console.log('Testando criação de operação...');
    
    const testOperacao = new Operacao({
      nome: 'Operação de Teste',
      ticker: 'PETR4',  // Adicionando ticker
      tipo: 'CALL',
      direcao: 'COMPRA',
      strike: 50.0,
      preco: 2.5,
      mesReferencia: 'abril',
      observacoes: 'Operação de teste via API'
    });
    
    try {
      await testOperacao.save();
      console.log('Operação de teste criada com sucesso! ID:', testOperacao._id);
      
      // Buscar a operação recém-criada
      const findResult = await Operacao.findById(testOperacao._id);
      console.log('Operação encontrada:', findResult ? 'Sim' : 'Não');
      
      // Excluir a operação de teste para não poluir o banco
      if (findResult) {
        await Operacao.findByIdAndDelete(testOperacao._id);
        console.log('Operação de teste excluída com sucesso!');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Conexão e operações CRUD testadas com sucesso!',
        testOperacao: {
          id: testOperacao._id,
          idVisual: testOperacao.idVisual,
          ticker: testOperacao.ticker,
          nome: testOperacao.nome,
          dataAbertura: testOperacao.dataAbertura,
          criado: !!findResult,
          excluido: true
        }
      });
    } catch (saveError) {
      console.error('Erro ao salvar operação de teste:', saveError);
      return NextResponse.json({
        success: false,
        message: 'Falha ao salvar operação de teste',
        error: saveError.message,
        errorDetails: {
          name: saveError.name,
          code: saveError.code,
          keyPattern: saveError.keyPattern,
          validationErrors: saveError.errors ? 
            Object.keys(saveError.errors).map(key => ({
              field: key,
              message: saveError.errors[key].message,
              kind: saveError.errors[key].kind,
              path: saveError.errors[key].path,
              value: saveError.errors[key].value
            })) : null
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Falha na conexão com o MongoDB:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Falha ao conectar com o MongoDB',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}