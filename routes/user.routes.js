const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rotas de usuário
router.get('/profile', authMiddleware.verifyToken, authController.getUserProfile);
router.put('/profile', authMiddleware.verifyToken, authController.updateUserProfile);

module.exports = router;
