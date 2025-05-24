const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContentSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true // Índice para busca rápida por slug
  },
  descricao: {
    type: String,
    required: true
  },
  conteudo: {
    type: String,
    required: true
  },
  autor: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Author'
    },
    nome: {
      type: String,
      required: true
    },
    credenciais: {
      type: String
    }
  },
  data_publicacao: {
    type: Date,
    default: Date.now
  },
  ultima_atualizacao: {
    type: Date,
    default: Date.now
  },
  categorias: [{
    type: String,
    required: true
  }],
  tags: [{
    type: String
  }],
  fases_aplicaveis: [{
    type: String,
    enum: ['gestante', 'recem_nascido', 'bebe_4_12', 'crianca_1_3', 'planejando'],
    required: true
  }],
  tempo_leitura: {
    type: Number,
    required: true
  },
  imagem_destaque: {
    type: String,
    required: true
  },
  relacionados: [{
    type: Schema.Types.ObjectId,
    ref: 'Content'
  }],
  visualizacoes: {
    type: Number,
    default: 0
  },
  avaliacao_media: {
    type: Number,
    default: 0
  },
  avaliacoes_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['rascunho', 'publicado', 'arquivado'],
    default: 'publicado'
  }
}, {
  timestamps: true
});

// Índices para melhorar performance de busca
ContentSchema.index({ titulo: 'text', descricao: 'text', tags: 'text' });
ContentSchema.index({ fases_aplicaveis: 1 });
ContentSchema.index({ categorias: 1 });
ContentSchema.index({ data_publicacao: -1 }); // Para ordenação por data mais recente
ContentSchema.index({ visualizacoes: -1 }); // Para ordenação por popularidade

module.exports = mongoose.model('Content', ContentSchema);
