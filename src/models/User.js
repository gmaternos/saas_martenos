const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Por favor, forneça um email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, forneça um email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor, forneça uma senha'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Por favor, forneça um nome'],
    trim: true
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    preferences: {
      type: Object,
      default: {}
    },
    language: {
      type: String,
      enum: ['pt', 'en', 'es'],
      default: 'pt'
    },
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    }
  },
  role: {
    type: String,
    enum: ['parent', 'educator', 'admin'],
    default: 'parent'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'family', 'growth', 'complete', 'educator'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'canceled'],
      default: 'free'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    paymentMethod: {
      type: Object,
      default: {}
    }
  },
  socialAuth: [{
    provider: {
      type: String,
      enum: ['google', 'facebook', 'apple']
    },
    id: {
      type: String
    }
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Criptografar senha antes de salvar
UserSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar senha
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
