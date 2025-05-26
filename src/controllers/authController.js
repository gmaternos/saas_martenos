const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');

// Gerar token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Enviar resposta com token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remover senha da saída
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// Registrar novo usuário
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Este email já está em uso.',
          code: 'EMAIL_IN_USE'
        }
      });
    }
    
    // Criar novo usuário
    const user = await User.create({
      name,
      email,
      password,
      lastLogin: Date.now()
    });
    
    createSendToken(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao registrar usuário.',
        code: 'REGISTRATION_ERROR'
      }
    });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar se email e senha foram fornecidos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Por favor, forneça email e senha.',
          code: 'MISSING_CREDENTIALS'
        }
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Email ou senha incorretos.',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // Verificar se a senha está correta
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Email ou senha incorretos.',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // Verificar se a conta está ativa
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Esta conta está inativa ou suspensa.',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }
    
    // Atualizar último login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao fazer login.',
        code: 'LOGIN_ERROR'
      }
    });
  }
};

// Obter usuário atual
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const { name, profile } = req.body;
    
    // Campos que podem ser atualizados
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (profile) {
      if (profile.avatar) fieldsToUpdate['profile.avatar'] = profile.avatar;
      if (profile.bio) fieldsToUpdate['profile.bio'] = profile.bio;
      if (profile.preferences) fieldsToUpdate['profile.preferences'] = profile.preferences;
      if (profile.language) fieldsToUpdate['profile.language'] = profile.language;
      if (profile.timezone) fieldsToUpdate['profile.timezone'] = profile.timezone;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao atualizar perfil.',
        code: 'UPDATE_PROFILE_ERROR'
      }
    });
  }
};

// Atualizar senha
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verificar se as senhas foram fornecidas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Por favor, forneça a senha atual e a nova senha.',
          code: 'MISSING_PASSWORDS'
        }
      });
    }
    
    // Verificar se a nova senha tem pelo menos 6 caracteres
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'A nova senha deve ter pelo menos 6 caracteres.',
          code: 'PASSWORD_TOO_SHORT'
        }
      });
    }
    
    // Obter usuário com senha
    const user = await User.findById(req.user._id).select('+password');
    
    // Verificar se a senha atual está correta
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Senha atual incorreta.',
          code: 'INCORRECT_PASSWORD'
        }
      });
    }
    
    // Atualizar senha
    user.password = newPassword;
    await user.save();
    
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao atualizar senha.',
        code: 'UPDATE_PASSWORD_ERROR'
      }
    });
  }
};

// Solicitar redefinição de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar se o email foi fornecido
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Por favor, forneça um email.',
          code: 'MISSING_EMAIL'
        }
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Não existe um usuário com este email.',
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    // Gerar token de redefinição de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash do token e definir expiração (10 minutos)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });
    
    // No MVP, apenas retornamos o token para testes
    // Em produção, enviaríamos um email com o link de redefinição
    res.status(200).json({
      success: true,
      message: 'Token de redefinição de senha enviado.',
      resetToken // Remover em produção
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao solicitar redefinição de senha.',
        code: 'FORGOT_PASSWORD_ERROR'
      }
    });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Hash do token recebido
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Verificar se o token é válido e não expirou
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Token inválido ou expirado.',
          code: 'INVALID_TOKEN'
        }
      });
    }
    
    // Definir nova senha e limpar campos de redefinição
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao redefinir senha.',
        code: 'RESET_PASSWORD_ERROR'
      }
    });
  }
};
