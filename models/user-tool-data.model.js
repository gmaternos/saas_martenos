const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserToolDataSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ferramenta: {
    type: Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  dados: {
    type: Schema.Types.Mixed,
    required: true
  },
  ultima_atualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice composto para busca rápida por usuário e ferramenta
UserToolDataSchema.index({ usuario: 1, ferramenta: 1 }, { unique: true });

module.exports = mongoose.model('UserToolData', UserToolDataSchema);
