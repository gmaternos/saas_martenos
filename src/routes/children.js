const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { protect } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para gerenciamento de crianças
router.route('/')
  .get(childController.getChildren)
  .post(childController.createChild);

router.route('/:id')
  .get(childController.getChild)
  .patch(childController.updateChild)
  .delete(childController.deleteChild);

// Rota para obter idade formatada
router.get('/:id/age', childController.getChildAge);

module.exports = router;
