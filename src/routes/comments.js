const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/auth');

// Rotas protegidas
router.use(protect);

router.route('/:id')
  .get(commentController.getComment)
  .patch(commentController.updateComment)
  .delete(commentController.deleteComment);

router.post('/:id/like', commentController.likeComment);
router.post('/:id/flag', commentController.flagComment);

module.exports = router;
