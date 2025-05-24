const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rotas públicas
router.get('/search', contentController.searchContent);
router.get('/:slug', contentController.getContentBySlug);

// Rotas protegidas
router.get('/recommended', authMiddleware.verifyToken, contentController.getRecommendedContent);
router.post('/:contentId/rate', authMiddleware.verifyToken, contentController.rateContent);

module.exports = router;
