const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rotas públicas
router.post('/register', authController.register);

// Rotas protegidas
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);
router.put('/profile', authMiddleware.verifyToken, authController.updateProfile);

module.exports = router;
