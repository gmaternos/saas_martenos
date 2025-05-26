const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Rotas protegidas
router.get('/me', protect, authController.getMe);
router.patch('/update-profile', protect, authController.updateProfile);
router.patch('/update-password', protect, authController.updatePassword);

module.exports = router;
