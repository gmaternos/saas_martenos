const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContentRatingSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conteudo: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  avaliacao: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String
  },
  data: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice composto para garantir que um usuário só avalie um conteúdo uma vez
ContentRatingSchema.index({ usuario: 1, conteudo: 1 }, { unique: true });

module.exports = mongoose.model('ContentRating', ContentRatingSchema);
