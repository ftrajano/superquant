import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  // Ação realizada
  action: {
    type: String,
    required: true,
    enum: ['activate', 'extend', 'deactivate', 'create_user', 'delete_user', 'change_role']
  },

  // Categoria da ação
  category: {
    type: String,
    required: true,
    enum: ['subscription', 'user_management', 'system'],
    default: 'subscription'
  },

  // Quem executou a ação
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userEmail: String,
    userRole: String
  },

  // Usuário alvo da ação (se aplicável)
  targetUser: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userEmail: String
  },

  // Detalhes específicos da ação
  details: {
    // Para assinaturas
    subscriptionPlan: String,
    previousStatus: String,
    newStatus: String,
    previousExpirationDate: Date,
    newExpirationDate: Date,
    
    // Valores monetários
    amount: Number,
    
    // Motivo/observação
    reason: String,
    
    // Dados extras em JSON
    metadata: mongoose.Schema.Types.Mixed
  },

  // Descrição legível da ação
  description: {
    type: String,
    required: true
  },

  // IP do usuário que executou
  ipAddress: String,

  // User Agent
  userAgent: String,

  // Data da ação
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true // Cria createdAt e updatedAt automaticamente
});

// Índices para consulta eficiente
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ 'performedBy.userId': 1 });
AuditLogSchema.index({ 'targetUser.userId': 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ category: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;