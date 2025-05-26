const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'Conteúdo é obrigatório']
  },
  attachments: [{
    type: String // URLs de anexos
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'pinned'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }],
  category: {
    type: String,
    default: 'geral'
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhorar a performance das consultas
TopicSchema.index({ communityId: 1 });
TopicSchema.index({ userId: 1 });
TopicSchema.index({ status: 1 });
TopicSchema.index({ tags: 1 });
TopicSchema.index({ lastActivity: -1 });

// Virtual para comentários
TopicSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'entityId',
  match: { entityType: 'topic' }
});

// Método para incrementar visualizações
TopicSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Método para adicionar like
TopicSchema.methods.addLike = async function(userId) {
  // Verificar se o usuário já deu like
  if (!this.likedBy.includes(userId)) {
    this.likes += 1;
    this.likedBy.push(userId);
    return this.save();
  }
  return this;
};

// Método para remover like
TopicSchema.methods.removeLike = async function(userId) {
  // Verificar se o usuário deu like
  if (this.likedBy.includes(userId)) {
    this.likes = Math.max(0, this.likes - 1);
    this.likedBy = this.likedBy.filter(id => id.toString() !== userId.toString());
    return this.save();
  }
  return this;
};

// Método para atualizar a data da última atividade
TopicSchema.methods.updateLastActivity = async function() {
  this.lastActivity = Date.now();
  return this.save();
};

// Middleware para atualizar lastActivity quando o tópico for modificado
TopicSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

module.exports = mongoose.model('Topic', TopicSchema);
