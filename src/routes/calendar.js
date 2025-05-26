const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { protect } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para calendários
router.route('/')
  .get(calendarController.getCalendars)
  .post(calendarController.createCalendar);

router.route('/:id')
  .get(calendarController.getCalendar)
  .patch(calendarController.updateCalendar)
  .delete(calendarController.deleteCalendar);

// Rotas para compartilhamento
router.post('/:id/share', calendarController.shareCalendar);
router.delete('/:id/share/:userId', calendarController.removeShare);

module.exports = router;
