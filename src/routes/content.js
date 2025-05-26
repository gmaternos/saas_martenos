const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middlewares/auth');

// Rotas públicas
router.get('/', contentController.getAllContent);
router.get('/:id', contentController.getContent);

// Rotas protegidas
router.use(protect);
router.get('/recommended', contentController.getRecommendedContent);
router.post('/:id/like', contentController.likeContent);

module.exports = router;
