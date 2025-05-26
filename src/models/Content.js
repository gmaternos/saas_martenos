const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['article', 'guide', 'video', 'infographic', 'podcast'],
    required: [true, 'Tipo de conteúdo é obrigatório']
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug é obrigatório'],
    unique: true,
    trim: true,
    lowercase: true
  },
  summary: {
    type: String,
    required: [true, 'Resumo é obrigatório']
  },
  content: {
    type: String,
    required: [true, 'Conteúdo é obrigatório']
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Nome do autor é obrigatório']
    },
    bio: {
      type: String
    },
    avatar: {
      type: String
    }
  },
  coverImage: {
    type: String
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  premium: {
    type: Boolean,
    default: false
  },
  ageRelevance: [{
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  }],
  categories: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  readTime: {
    type: Number
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['pt', 'en', 'es'],
    default: 'pt'
  },
  translations: {
    type: Object,
    default: {}
  },
  seo: {
    metaTitle: {
      type: String
    },
    metaDescription: {
      type: String
    },
    keywords: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
ContentSchema.index({ slug: 1 });
ContentSchema.index({ type: 1, status: 1 });
ContentSchema.index({ 'ageRelevance.min': 1, 'ageRelevance.max': 1 });
ContentSchema.index({ language: 1 });
ContentSchema.index({ categories: 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ premium: 1 });

// Método para calcular o tempo de leitura antes de salvar
ContentSchema.pre('save', function(next) {
  if (this.type === 'article' || this.type === 'guide') {
    // Média de 200 palavras por minuto
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  
  // Atualizar lastUpdated
  this.lastUpdated = Date.now();
  
  next();
});

// Método para verificar se o conteúdo é relevante para uma determinada idade
ContentSchema.methods.isRelevantForAge = function(ageInMonths) {
  if (!this.ageRelevance || this.ageRelevance.length === 0) {
    return true; // Se não houver restrição de idade, é relevante para todos
  }
  
  return this.ageRelevance.some(range => 
    ageInMonths >= range.min && ageInMonths <= range.max
  );
};

// Método para incrementar visualizações
ContentSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Método para incrementar likes
ContentSchema.methods.incrementLikes = async function() {
  this.likes += 1;
  return this.save();
};

module.exports = mongoose.model('Content', ContentSchema);
