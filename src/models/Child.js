const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  birthDate: {
    type: Date,
    required: [true, 'Data de nascimento é obrigatória']
  },
  dueDate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown'],
    default: 'unknown'
  },
  photo: {
    type: String,
    default: ''
  },
  developmentStage: {
    type: String,
    default: ''
  },
  specialNeeds: [{
    type: String
  }],
  interests: [{
    type: String
  }],
  educationInfo: {
    school: {
      type: String,
      default: ''
    },
    grade: {
      type: String,
      default: ''
    },
    teacher: {
      type: String,
      default: ''
    }
  },
  healthInfo: {
    allergies: [{
      type: String
    }],
    conditions: [{
      type: String
    }],
    medications: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Método para calcular idade em meses
ChildSchema.methods.getAgeInMonths = function() {
  const today = new Date();
  const birthDate = this.birthDate;
  
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  
  // Ajuste para dias do mês
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  
  return months;
};

// Método para calcular idade em anos e meses
ChildSchema.methods.getFormattedAge = function() {
  const ageInMonths = this.getAgeInMonths();
  
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;
  
  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
};

// Método para determinar o estágio de desenvolvimento com base na idade
ChildSchema.methods.calculateDevelopmentStage = function() {
  const ageInMonths = this.getAgeInMonths();
  
  if (ageInMonths < 0) {
    return 'gestação';
  } else if (ageInMonths < 1) {
    return 'recém-nascido';
  } else if (ageInMonths < 12) {
    return 'bebê';
  } else if (ageInMonths < 36) {
    return 'criança pequena';
  } else if (ageInMonths < 60) {
    return 'pré-escolar';
  } else {
    return 'criança em idade escolar';
  }
};

// Atualizar estágio de desenvolvimento antes de salvar
ChildSchema.pre('save', function(next) {
  if (this.birthDate) {
    this.developmentStage = this.calculateDevelopmentStage();
  }
  next();
});

module.exports = mongoose.model('Child', ChildSchema);
