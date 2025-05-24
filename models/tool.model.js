const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ToolSchema = new Schema({
  nome: {
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
  tipo: {
    type: String,
    enum: ['rastreador', 'diario', 'calculadora', 'checklist', 'outro'],
    required: true,
    index: true // Índice para filtros por tipo
  },
  fases_aplicaveis: [{
    type: String,
    enum: ['gestante', 'recem_nascido', 'bebe_4_12', 'crianca_1_3', 'planejando'],
    required: true,
    index: true // Índice para filtros por fase
  }],
  configuracao: {
    type: Schema.Types.Mixed,
    default: {}
  },
  icone: {
    type: String,
    required: true
  },
  ordem_exibicao: {
    type: Number,
    default: 999
  },
  status: {
    type: String,
    enum: ['ativo', 'beta', 'inativo'],
    default: 'ativo',
    index: true // Índice para filtros por status
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tool', ToolSchema);
