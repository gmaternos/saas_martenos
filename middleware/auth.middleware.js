const admin = require('../config/firebase-admin');
const User = require('../models/user.model');

/**
 * Middleware para verificar token Firebase e autenticar usuário
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Verificar se o header de autorização está presente
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token de autenticação não fornecido' 
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    // Verificar o token com Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Adicionar o UID decodificado ao objeto de requisição
    req.uid = decodedToken.uid;
    
    // Buscar o usuário no banco de dados
    const user = await User.findOne({ firebase_uid: decodedToken.uid });
    
    // Se o usuário não existir no banco de dados
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Se o usuário estiver inativo
    if (!user.ativo) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Conta de usuário desativada' 
      });
    }
    
    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    
    // Prosseguir para o próximo middleware/controlador
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token expirado' 
      });
    }
    
    return res.status(401).json({ 
      status: 'error', 
      message: 'Token inválido' 
    });
  }
};

/**
 * Middleware para verificar permissões de administrador
 */
exports.isAdmin = async (req, res, next) => {
  try {
    // Verificar se o usuário existe no objeto de requisição
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Não autenticado' 
      });
    }
    
    // Verificar claims personalizadas no Firebase
    const { customClaims } = await admin.auth().getUser(req.uid);
    
    if (!customClaims || !customClaims.admin) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Acesso negado: permissões insuficientes' 
      });
    }
    
    // Prosseguir para o próximo middleware/controlador
    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao verificar permissões' 
    });
  }
};
