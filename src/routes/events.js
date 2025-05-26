const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para eventos
router.route('/calendars/:calendarId/events')
  .get(eventController.getEvents)
  .post(eventController.createEvent);

router.route('/events/:id')
  .get(eventController.getEvent)
  .patch(eventController.updateEvent)
  .delete(eventController.deleteEvent);

// Rota para obter ocorrências de eventos recorrentes
router.get('/events/:id/occurrences', eventController.getEventOccurrences);

module.exports = router;
