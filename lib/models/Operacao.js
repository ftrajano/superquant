// lib/models/Operacao.js
import mongoose from 'mongoose';

// Verificar se o modelo já existe para evitar erro de redefinição
const OperacaoSchema = new mongoose.Schema({
  idVisual: {
    type: String,
    default: function() {
      // Gerar ID visual automático com formato OP-XXXX
      const randomId = Math.floor(1000 + Math.random() * 9000);
      return `OP-${randomId}`;
    }
  },
  // Campo userId para identificar o dono da operação
  userId: {
    // Aceita tanto String quanto ObjectId para maior compatibilidade
    type: String,
    required: false, // Para manter compatibilidade com dados existentes
    index: true // Adicionar índice para melhorar performance de consultas
  },
  // Manter compatibilidade com dados existentes
  nome: { 
    type: String,
    required: false
  },
  ticker: { 
    type: String, 
    required: [true, 'Ticker é obrigatório'] 
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
  quantidadeFechada: {
    type: Number,
    default: 0
  },
  operacaoOriginalId: {
    type: String, // Para referenciar a operação original em caso de fechamento parcial
    default: null
  },
  operacoesRelacionadas: [{
    type: String // IDs de operações relacionadas (criadas a partir desta)
  }],
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
  quantidade: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    default: 1
  },
  valorTotal: {
    type: Number,
    default: function() {
      return this.preco * (this.quantidade || 1);
    }
  },
  margemUtilizada: {
    type: Number,
    default: 0  // Valor de margem usado para esta operação
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
  anoReferencia: {
    type: Number,
    required: [true, 'Ano de referência é obrigatório'],
    default: function() {
      return new Date().getFullYear();
    }
  },
  resultadoTotal: { 
    type: Number, 
    default: 0 
  },
  // Campos para colorir operações relacionadas
  corEstrategia: {
    type: String,
    default: null // Cor em formato hex (#FF0000) ou nome da cor
  },
  nomeEstrategia: {
    type: String,
    default: null // Nome da estratégia (ex: "Trava de Alta PETR4")
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Verificar se o modelo já existe antes de defini-lo
export default mongoose.models.Operacao || mongoose.model('Operacao', OperacaoSchema);