const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MilestoneSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true
  },
  fase_materna: {
    type: String,
    enum: ['gestante', 'recem_nascido', 'bebe_4_12', 'crianca_1_3', 'planejando'],
    required: true,
    index: true // Índice para filtros por fase
  },
  idade_bebe_meses: {
    type: Number
  },
  semana_gestacao: {
    type: Number
  },
  categoria: {
    type: String,
    enum: ['desenvolvimento', 'saude', 'alimentacao', 'sono', 'outro'],
    required: true,
    index: true // Índice para filtros por categoria
  },
  icone: {
    type: String
  },
  conteudos_relacionados: [{
    type: Schema.Types.ObjectId,
    ref: 'Content'
  }],
  ferramentas_relacionadas: [{
    type: Schema.Types.ObjectId,
    ref: 'Tool'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
