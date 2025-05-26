const mongoose = require('mongoose');

const DevelopmentSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'ID da criança é obrigatório']
  },
  category: {
    type: String,
    enum: ['motor', 'cognitive', 'social', 'language', 'emotional'],
    required: [true, 'Categoria é obrigatória']
  },
  milestone: {
    type: String,
    required: [true, 'Marco de desenvolvimento é obrigatório']
  },
  expectedAge: {
    min: {
      type: Number,
      required: [true, 'Idade mínima esperada é obrigatória']
    },
    max: {
      type: Number,
      required: [true, 'Idade máxima esperada é obrigatória']
    }
  },
  achievedDate: {
    type: Date
  },
  notes: {
    type: String
  },
  evidence: [{
    type: String // URLs de fotos/vídeos
  }]
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
DevelopmentSchema.index({ childId: 1, category: 1 });
DevelopmentSchema.index({ childId: 1, achievedDate: 1 });

// Método para verificar se o marco foi alcançado
DevelopmentSchema.methods.isAchieved = function() {
  return !!this.achievedDate;
};

// Método para verificar se o marco está atrasado
DevelopmentSchema.methods.isDelayed = function(ageInMonths) {
  return !this.isAchieved() && ageInMonths > this.expectedAge.max;
};

// Método para verificar se o marco está no prazo
DevelopmentSchema.methods.isOnTime = function(ageInMonths) {
  return this.isAchieved() && 
         ageInMonths >= this.expectedAge.min && 
         ageInMonths <= this.expectedAge.max;
};

// Método para verificar se o marco foi alcançado precocemente
DevelopmentSchema.methods.isEarly = function(ageInMonths) {
  return this.isAchieved() && ageInMonths < this.expectedAge.min;
};

module.exports = mongoose.model('Development', DevelopmentSchema);
