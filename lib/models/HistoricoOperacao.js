// lib/models/HistoricoOperacao.js
import mongoose from 'mongoose';

const HistoricoOperacaoSchema = new mongoose.Schema({
  // Referência ao usuário modelo que fez a operação
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Referência à operação original
  operacaoId: {
    type: String,
    required: true
  },
  // Nome/identificador da operação
  nome: {
    type: String,
    required: true
  },
  // Tipo de opção
  tipo: {
    type: String,
    enum: ['CALL', 'PUT'],
    required: true
  },
  // Direção da operação
  direcao: {
    type: String,
    enum: ['COMPRA', 'VENDA'],
    required: true
  },
  // Quantidade de contratos
  quantidade: {
    type: Number,
    required: true
  },
  // Data/hora da operação
  dataOperacao: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Informações adicionais da operação
  ticker: {
    type: String,
    required: true
  },
  strike: {
    type: Number,
    required: true
  },
  preco: {
    type: Number,
    required: true
  },
  mesReferencia: {
    type: String,
    required: true
  },
  anoReferencia: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Índices para melhorar performance
HistoricoOperacaoSchema.index({ userId: 1, dataOperacao: -1 });
HistoricoOperacaoSchema.index({ nome: 'text' }); // Para busca textual

// Verificar se o modelo já existe antes de defini-lo
export default mongoose.models.HistoricoOperacao || mongoose.model('HistoricoOperacao', HistoricoOperacaoSchema);