const express = require('express');
const router = express.Router();
const developmentController = require('../controllers/developmentController');
const { protect } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para marcos de desenvolvimento
router.route('/children/:childId/milestones')
  .get(developmentController.getMilestones)
  .post(developmentController.createMilestone);

router.route('/children/:childId/milestones/:id')
  .get(developmentController.getMilestone)
  .patch(developmentController.updateMilestone)
  .delete(developmentController.deleteMilestone);

// Rota para registrar marco como alcançado
router.post('/children/:childId/milestones/:id/achieve', developmentController.achieveMilestone);

module.exports = router;
