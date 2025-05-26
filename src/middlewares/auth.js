const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Verificar se o token está presente no header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Verificar se o token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Você não está autenticado. Por favor, faça login para acessar.',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }
    
    // Verificar se o token é válido
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'O usuário associado a este token não existe mais.',
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Esta conta está inativa ou suspensa.',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }
    
    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token inválido. Por favor, faça login novamente.',
          code: 'INVALID_TOKEN'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Sua sessão expirou. Por favor, faça login novamente.',
          code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao autenticar usuário.',
        code: 'AUTH_ERROR'
      }
    });
  }
};

// Middleware para restringir acesso por função
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para realizar esta ação.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    next();
  };
};

// Middleware para verificar propriedade de um recurso
exports.checkOwnership = (Model, paramIdField = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramIdField];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Recurso não encontrado.',
            code: 'RESOURCE_NOT_FOUND'
          }
        });
      }
      
      // Verificar se o usuário é o proprietário do recurso
      if (resource[userIdField].toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Você não tem permissão para acessar este recurso.',
            code: 'PERMISSION_DENIED'
          }
        });
      }
      
      // Adicionar o recurso ao objeto de requisição
      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erro ao verificar propriedade do recurso.',
          code: 'OWNERSHIP_CHECK_ERROR'
        }
      });
    }
  };
};
