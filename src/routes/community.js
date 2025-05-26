const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { protect } = require('../middlewares/auth');

// Rotas públicas
router.get('/', topicController.getTopics);
router.get('/:id', topicController.getTopic);
router.get('/:id/comments', topicController.getTopicComments);

// Rotas protegidas
router.use(protect);
router.post('/', topicController.createTopic);
router.patch('/:id', topicController.updateTopic);
router.delete('/:id', topicController.deleteTopic);
router.post('/:id/like', topicController.likeTopic);
router.post('/:id/comments', topicController.addComment);

module.exports = router;
