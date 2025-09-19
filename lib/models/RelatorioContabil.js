import mongoose from 'mongoose';

const RelatorioContabilSchema = new mongoose.Schema({
  // Data de fechamento (não mais baseado em mês/ano fixo)
  dataFechamento: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Período que este relatório abrange
  periodoInicio: {
    type: Date,
    required: true // Data do último fechamento (ou início do sistema)
  },

  periodoFim: {
    type: Date,
    required: true // Data deste fechamento
  },

  // Breakdown por tipo de assinatura
  breakdown: {
    monthly: {
      quantidade: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    quarterly: {
      quantidade: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    yearly: {
      quantidade: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },

  // Totais
  totalFaturado: {
    type: Number,
    required: true
  },

  // Impostos (6%)
  impostos: {
    type: Number,
    required: true
  },

  // Total líquido (faturado - impostos)
  totalLiquido: {
    type: Number,
    required: true
  },

  // Assinaturas contabilizadas neste período
  assinaturasContabilizadas: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userEmail: String,
    plano: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: true
    },
    valor: {
      type: Number,
      required: true
    },
    dataAssinatura: Date
  }],

  // Auditoria
  fechadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechadoPorNome: String
}, {
  timestamps: true
});

// Índice para performance na busca do último fechamento
RelatorioContabilSchema.index({ dataFechamento: -1 });

const RelatorioContabil = mongoose.models.RelatorioContabil || mongoose.model('RelatorioContabil', RelatorioContabilSchema);

export default RelatorioContabil;