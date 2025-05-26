const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ID da entidade é obrigatório']
  },
  entityType: {
    type: String,
    enum: ['topic', 'content'],
    required: [true, 'Tipo da entidade é obrigatório']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  content: {
    type: String,
    required: [true, 'Conteúdo é obrigatório'],
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  attachments: [{
    type: String // URLs de anexos
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'flagged'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhorar a performance das consultas
CommentSchema.index({ entityId: 1, entityType: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentId: 1 });

// Virtual para respostas (comentários filhos)
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId'
});

// Método para adicionar like
CommentSchema.methods.addLike = async function(userId) {
  // Verificar se o usuário já deu like
  if (!this.likedBy.includes(userId)) {
    this.likes += 1;
    this.likedBy.push(userId);
    return this.save();
  }
  return this;
};

// Método para remover like
CommentSchema.methods.removeLike = async function(userId) {
  // Verificar se o usuário deu like
  if (this.likedBy.includes(userId)) {
    this.likes = Math.max(0, this.likes - 1);
    this.likedBy = this.likedBy.filter(id => id.toString() !== userId.toString());
    return this.save();
  }
  return this;
};

// Método para marcar como editado
CommentSchema.methods.markAsEdited = async function() {
  this.isEdited = true;
  return this.save();
};

// Método para marcar como excluído (soft delete)
CommentSchema.methods.markAsDeleted = async function() {
  this.status = 'deleted';
  this.content = '[Comentário removido]';
  return this.save();
};

// Método para marcar como sinalizado
CommentSchema.methods.markAsFlagged = async function() {
  this.status = 'flagged';
  return this.save();
};

module.exports = mongoose.model('Comment', CommentSchema);
