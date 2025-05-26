const Event = require('../models/Event');
const Calendar = require('../models/Calendar');

// Obter todos os eventos de um calendário
exports.getEvents = async (req, res) => {
  try {
    const { calendarId } = req.params;
    
    // Verificar se o calendário existe e se o usuário tem acesso
    const calendar = await Calendar.findById(calendarId);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    if (!calendar.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para acessar este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Parâmetros de filtragem
    const { startDate, endDate, childId, category } = req.query;
    
    // Construir query
    let query = { calendarId };
    
    // Filtrar por intervalo de datas
    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }
    
    // Filtrar por criança
    if (childId) {
      query.childId = childId;
    }
    
    // Filtrar por categoria
    if (category) {
      query.category = category;
    }
    
    const events = await Event.find(query).sort({ startDate: 1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: {
        events
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar eventos.',
        code: 'GET_EVENTS_ERROR'
      }
    });
  }
};

// Obter um evento específico
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Evento não encontrado.',
          code: 'EVENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem acesso ao calendário do evento
    const calendar = await Calendar.findById(event.calendarId);
    
    if (!calendar || !calendar.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para acessar este evento.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar evento.',
        code: 'GET_EVENT_ERROR'
      }
    });
  }
};

// Criar novo evento
exports.createEvent = async (req, res) => {
  try {
    const { calendarId } = req.params;
    
    // Verificar se o calendário existe e se o usuário tem permissão de escrita
    const calendar = await Calendar.findById(calendarId);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    if (!calendar.canWrite(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para adicionar eventos a este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Adicionar calendarId ao corpo da requisição
    req.body.calendarId = calendarId;
    
    const event = await Event.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(', '),
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao criar evento.',
        code: 'CREATE_EVENT_ERROR'
      }
    });
  }
};

// Atualizar evento
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Evento não encontrado.',
          code: 'EVENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem permissão para editar o calendário do evento
    const calendar = await Calendar.findById(event.calendarId);
    
    if (!calendar || !calendar.canWrite(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para editar este evento.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Não permitir alterar o calendarId
    if (req.body.calendarId) {
      delete req.body.calendarId;
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(', '),
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao atualizar evento.',
        code: 'UPDATE_EVENT_ERROR'
      }
    });
  }
};

// Excluir evento
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Evento não encontrado.',
          code: 'EVENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem permissão para editar o calendário do evento
    const calendar = await Calendar.findById(event.calendarId);
    
    if (!calendar || !calendar.canWrite(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para excluir este evento.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    await event.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir evento.',
        code: 'DELETE_EVENT_ERROR'
      }
    });
  }
};

// Obter próximas ocorrências de um evento recorrente
exports.getEventOccurrences = async (req, res) => {
  try {
    const { count } = req.query;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Evento não encontrado.',
          code: 'EVENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem acesso ao calendário do evento
    const calendar = await Calendar.findById(event.calendarId);
    
    if (!calendar || !calendar.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para acessar este evento.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    const occurrences = event.getNextOccurrences(parseInt(count) || 5);
    
    res.status(200).json({
      success: true,
      count: occurrences.length,
      data: {
        occurrences
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar ocorrências do evento.',
        code: 'GET_EVENT_OCCURRENCES_ERROR'
      }
    });
  }
};
