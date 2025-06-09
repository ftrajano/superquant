// lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória']
  },
  role: {
    type: String,
    enum: ['user', 'modelo', 'admin'],
    default: 'user'
  },
  image: {
    type: String,
    default: null
  },
  // Campos para controle de margem
  margemTotal: {
    type: Number,
    default: 0
  },
  margemUtilizada: {
    type: Number,
    default: 0
  },
  historicoMargem: [{
    data: {
      type: Date,
      default: Date.now
    },
    valor: {
      type: Number,
      required: true
    },
    tipo: {
      type: String,
      enum: ['deposito', 'saque', 'ajuste', 'configuracao_inicial'],
      required: true
    },
    descricao: String
  }],
  
  // Campos para confirmação de email
  emailConfirmed: {
    type: Boolean,
    default: undefined // Não definir valor padrão para não afetar usuários antigos
  },
  emailConfirmToken: {
    type: String,
    default: null
  },
  emailConfirmTokenExpiry: {
    type: Date,
    default: null
  },
  
  // Campos para reset de senha
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt
});

// Eliminar o modelo existente se houver
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Use 'users' como nome explícito da coleção para garantir consistência
export default mongoose.model('User', UserSchema, 'users');