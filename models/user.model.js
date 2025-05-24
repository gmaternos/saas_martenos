const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChildSchema = new Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  data_nascimento: {
    type: Date,
    required: true
  },
  genero: {
    type: String,
    enum: ["m", "f", "outro"],
    required: true
  }
});

const UserSchema = new Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true,
    index: true // Adicionado índice para busca rápida
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true // Adicionado índice para busca rápida
  },
  fase_materna: {
    type: String,
    enum: ["gestante", "recem_nascido", "bebe_4_12", "crianca_1_3", "planejando"],
    required: true,
    index: true // Adicionado índice para filtros
  },
  data_cadastro: {
    type: Date,
    default: Date.now
  },
  perfil: {
    foto: {
      type: String,
      default: ""
    },
    data_nascimento: {
      type: Date
    },
    filhos: [ChildSchema],
    preferencias: {
      temas_interesse: [String],
      notificacoes: {
        type: Boolean,
        default: true
      },
      frequencia_emails: {
        type: String,
        enum: ["diario", "semanal", "mensal", "nenhum"],
        default: "semanal"
      }
    }
  },
  progresso: {
    conteudos_vistos: [{
      type: Schema.Types.ObjectId,
      ref: "Content"
    }],
    ferramentas_usadas: [{
      type: Schema.Types.ObjectId,
      ref: "Tool"
    }],
    marcos_alcancados: [{
      type: Schema.Types.ObjectId,
      ref: "Milestone"
    }]
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

module.exports = mongoose.model("User", UserSchema);
