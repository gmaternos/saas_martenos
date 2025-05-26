const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  calendarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: [true, 'ID do calendário é obrigatório']
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  endDate: {
    type: Date,
    required: [true, 'Data de término é obrigatória']
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['appointment', 'activity', 'reminder', 'milestone', 'other'],
    default: 'other'
  },
  recurring: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1
    },
    until: {
      type: Date
    }
  },
  reminder: {
    type: {
      type: String,
      enum: ['notification', 'email', 'both', 'none'],
      default: 'notification'
    },
    minutes: {
      type: Number,
      default: 30
    }
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },
  color: {
    type: String,
    default: '#0ea5e9' // Cor primária padrão
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
EventSchema.index({ calendarId: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ childId: 1 });

// Método para verificar se o evento está ativo
EventSchema.methods.isActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

// Método para verificar se o evento está próximo
EventSchema.methods.isUpcoming = function(hoursThreshold = 24) {
  const now = new Date();
  const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);
  return this.startDate > now && this.startDate <= threshold;
};

// Método para verificar se o evento está atrasado
EventSchema.methods.isOverdue = function() {
  const now = new Date();
  return this.endDate < now;
};

// Método para gerar próximas ocorrências de eventos recorrentes
EventSchema.methods.getNextOccurrences = function(count = 5) {
  if (this.recurring.frequency === 'none') {
    return [this];
  }

  const occurrences = [];
  let currentDate = new Date(this.startDate);
  const duration = this.endDate.getTime() - this.startDate.getTime();
  
  for (let i = 0; i < count; i++) {
    // Adicionar a ocorrência atual
    const occurrence = {
      ...this.toObject(),
      startDate: new Date(currentDate),
      endDate: new Date(currentDate.getTime() + duration)
    };
    
    occurrences.push(occurrence);
    
    // Calcular a próxima data com base na frequência
    switch (this.recurring.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + this.recurring.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * this.recurring.interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + this.recurring.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + this.recurring.interval);
        break;
    }
    
    // Verificar se ultrapassou a data limite
    if (this.recurring.until && currentDate > this.recurring.until) {
      break;
    }
  }
  
  return occurrences;
};

module.exports = mongoose.model('Event', EventSchema);
