// lib/models/Operacao.js
import mongoose from 'mongoose';

// Verificar se o modelo já existe para evitar erro de redefinição
const OperacaoSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: [true, 'Nome da operação é obrigatório'] 
  },
  dataAbertura: { 
    type: Date, 
    default: Date.now 
  },
  dataFechamento: { 
    type: Date, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['Aberta', 'Fechada', 'Parcialmente Fechada'], 
    default: 'Aberta' 
  },
  precoFechamento: { 
    type: Number, 
    default: null 
  },
  tipo: {
    type: String,
    enum: ['CALL', 'PUT'],
    required: [true, 'Tipo de opção (CALL/PUT) é obrigatório']
  },
  direcao: {
    type: String,
    enum: ['COMPRA', 'VENDA'],
    required: [true, 'Direção (COMPRA/VENDA) é obrigatória']
  },
  strike: {
    type: Number,
    required: [true, 'Strike é obrigatório']
  },
  preco: {
    type: Number,
    required: [true, 'Preço é obrigatório']
  },
  observacoes: { 
    type: String 
  },
  mesReferencia: { 
    type: String,
    enum: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    required: [true, 'Mês de referência é obrigatório']
  },
  resultadoTotal: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Verificar se o modelo já existe antes de defini-lo
export default mongoose.models.Operacao || mongoose.model('Operacao', OperacaoSchema);