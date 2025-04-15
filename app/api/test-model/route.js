// app/api/test-model/route.js
import { NextResponse } from 'next/server';
import Operacao from '@/lib/models/Operacao';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Obter informações sobre o modelo
    const schema = Operacao.schema;
    const paths = schema.paths;
    
    // Organizar campos e suas propriedades
    const fields = {};
    Object.keys(paths).forEach(path => {
      if (path === '__v') return; // Ignorar campo de versionamento do Mongoose
      
      const fieldSchema = paths[path];
      fields[path] = {
        type: fieldSchema.instance,
        required: fieldSchema.isRequired ? true : false,
        default: fieldSchema.defaultValue,
        enum: fieldSchema.enumValues,
        validators: fieldSchema.validators?.map(v => ({
          type: v.type?.name || 'custom',
          message: v.message
        })) || []
      };
    });
    
    // Testar instanciação de modelo sem salvar
    console.log('Testando instanciação de modelo de Operação...');
    
    const testData = {
      nome: 'Teste de Modelo',
      tipo: 'CALL',
      direcao: 'COMPRA',
      strike: 45.0,
      preco: 2.5,
      mesReferencia: 'abril',
      observacoes: 'Teste de instanciação'
    };
    
    const testOperacao = new Operacao(testData);
    
    // Validar manualmente sem salvar
    let validationSuccess = true;
    let validationErrors = null;
    
    try {
      await testOperacao.validate();
    } catch (error) {
      validationSuccess = false;
      validationErrors = error.errors;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Informações do modelo obtidas com sucesso',
      model: {
        name: 'Operacao',
        collectionName: Operacao.collection.name,
        fields: fields
      },
      validationTest: {
        success: validationSuccess,
        errors: validationErrors ? 
          Object.keys(validationErrors).map(key => ({
            field: key,
            message: validationErrors[key].message,
            kind: validationErrors[key].kind,
            path: validationErrors[key].path,
            value: validationErrors[key].value
          })) : null,
        testData: testData
      }
    });
  } catch (error) {
    console.error('Erro ao testar modelo:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao obter informações do modelo',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}