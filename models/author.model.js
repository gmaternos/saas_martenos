const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    required: true
  },
  foto: {
    type: String
  },
  especialidade: {
    type: String,
    required: true
  },
  credenciais: {
    type: String,
    required: true
  },
  redes_sociais: {
    website: String,
    linkedin: String,
    instagram: String,
    twitter: String
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Author', AuthorSchema);
