const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#0ea5e9' // Cor primária padrão
  },
  shared: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
CalendarSchema.index({ userId: 1 });
CalendarSchema.index({ 'shared.userId': 1 });

// Método para verificar se um usuário tem acesso ao calendário
CalendarSchema.methods.hasAccess = function(userId) {
  // O proprietário sempre tem acesso
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Verificar se o usuário está na lista de compartilhamento
  return this.shared.some(share => share.userId.toString() === userId.toString());
};

// Método para verificar se um usuário tem permissão de escrita
CalendarSchema.methods.canWrite = function(userId) {
  // O proprietário sempre pode escrever
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Verificar se o usuário tem permissão de escrita ou admin
  const share = this.shared.find(share => share.userId.toString() === userId.toString());
  return share && (share.permission === 'write' || share.permission === 'admin');
};

// Método para verificar se um usuário tem permissão de admin
CalendarSchema.methods.isAdmin = function(userId) {
  // O proprietário sempre é admin
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Verificar se o usuário tem permissão de admin
  const share = this.shared.find(share => share.userId.toString() === userId.toString());
  return share && share.permission === 'admin';
};

// Método para adicionar um usuário compartilhado
CalendarSchema.methods.addSharedUser = function(userId, permission = 'read') {
  // Verificar se o usuário já está na lista
  const existingIndex = this.shared.findIndex(share => share.userId.toString() === userId.toString());
  
  if (existingIndex >= 0) {
    // Atualizar permissão se já existir
    this.shared[existingIndex].permission = permission;
  } else {
    // Adicionar novo compartilhamento
    this.shared.push({ userId, permission });
  }
  
  return this.save();
};

// Método para remover um usuário compartilhado
CalendarSchema.methods.removeSharedUser = function(userId) {
  this.shared = this.shared.filter(share => share.userId.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Calendar', CalendarSchema);
