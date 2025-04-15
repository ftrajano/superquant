// lib/models/Leg.js
import mongoose from 'mongoose';

const LegSchema = new mongoose.Schema({
  operacaoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Operacao', 
    required: true 
  },
  tipo: { 
    type: String, 
    enum: ['Compra', 'Venda'], 
    required: true 
  },
  ticker: { 
    type: String, 
    required: true,
    uppercase: true
  },
  vencimento: { 
    type: Date, 
    required: true 
  },
  strike: { 
    type: Number, 
    required: true 
  },
  quantidade: { 
    type: Number, 
    required: true 
  },
  precoEntrada: { 
    type: Number, 
    required: true 
  },
  precoSaida: { 
    type: Number
  },
  dataEntrada: { 
    type: Date, 
    default: Date.now 
  },
  dataSaida: { 
    type: Date 
  },
  resultado: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['Aberta', 'Fechada'], 
    default: 'Aberta' 
  }
}, {
  timestamps: true
});

// Adicionar método para calcular resultado
LegSchema.methods.calcularResultado = function() {
  if (this.precoEntrada && this.precoSaida && this.quantidade) {
    if (this.tipo === 'Compra') {
      return (this.precoSaida - this.precoEntrada) * this.quantidade;
    } else {
      return (this.precoEntrada - this.precoSaida) * this.quantidade;
    }
  }
  return null;
};

export default mongoose.models.Leg || mongoose.model('Leg', LegSchema);