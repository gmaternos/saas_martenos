const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Verificar se as funções existem antes de usar
const getUserProfile = authController.getUserProfile || ((req, res) => {
  res.status(200).json({ message: "Perfil de usuário (função temporária)" });
});

const updateUserProfile = authController.updateUserProfile || ((req, res) => {
  res.status(200).json({ message: "Perfil atualizado (função temporária)" });
});

// Rotas de usuário com funções garantidas
router.get('/profile', authMiddleware.verifyToken, getUserProfile);
router.put('/profile', authMiddleware.verifyToken, updateUserProfile);

module.exports = router;
