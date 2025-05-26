const Calendar = require('../models/Calendar');
const Event = require('../models/Event');

// Obter todos os calendários do usuário
exports.getCalendars = async (req, res) => {
  try {
    // Buscar calendários próprios
    const ownCalendars = await Calendar.find({ userId: req.user._id });
    
    // Buscar calendários compartilhados com o usuário
    const sharedCalendars = await Calendar.find({
      'shared.userId': req.user._id
    });
    
    const calendars = [...ownCalendars, ...sharedCalendars];
    
    res.status(200).json({
      success: true,
      count: calendars.length,
      data: {
        calendars
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar calendários.',
        code: 'GET_CALENDARS_ERROR'
      }
    });
  }
};

// Obter um calendário específico
exports.getCalendar = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem acesso ao calendário
    if (!calendar.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para acessar este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        calendar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar calendário.',
        code: 'GET_CALENDAR_ERROR'
      }
    });
  }
};

// Criar novo calendário
exports.createCalendar = async (req, res) => {
  try {
    // Adicionar userId ao corpo da requisição
    req.body.userId = req.user._id;
    
    const calendar = await Calendar.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        calendar
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
        message: 'Erro ao criar calendário.',
        code: 'CREATE_CALENDAR_ERROR'
      }
    });
  }
};

// Atualizar calendário
exports.updateCalendar = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário tem permissão para editar o calendário
    if (!calendar.canWrite(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para editar este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Não permitir alterar o userId
    if (req.body.userId) {
      delete req.body.userId;
    }
    
    const updatedCalendar = await Calendar.findByIdAndUpdate(
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
        calendar: updatedCalendar
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
        message: 'Erro ao atualizar calendário.',
        code: 'UPDATE_CALENDAR_ERROR'
      }
    });
  }
};

// Excluir calendário
exports.deleteCalendar = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o proprietário ou admin do calendário
    if (!calendar.isAdmin(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para excluir este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Excluir o calendário
    await calendar.remove();
    
    // Excluir todos os eventos associados
    await Event.deleteMany({ calendarId: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir calendário.',
        code: 'DELETE_CALENDAR_ERROR'
      }
    });
  }
};

// Compartilhar calendário
exports.shareCalendar = async (req, res) => {
  try {
    const { userId, permission } = req.body;
    
    if (!userId || !permission) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'ID do usuário e permissão são obrigatórios.',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    const calendar = await Calendar.findById(req.params.id);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o proprietário ou admin do calendário
    if (!calendar.isAdmin(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para compartilhar este calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Adicionar usuário compartilhado
    await calendar.addSharedUser(userId, permission);
    
    res.status(200).json({
      success: true,
      data: {
        calendar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao compartilhar calendário.',
        code: 'SHARE_CALENDAR_ERROR'
      }
    });
  }
};

// Remover compartilhamento
exports.removeShare = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const calendar = await Calendar.findById(req.params.id);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Calendário não encontrado.',
          code: 'CALENDAR_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o proprietário ou admin do calendário
    if (!calendar.isAdmin(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para remover compartilhamento deste calendário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Remover usuário compartilhado
    await calendar.removeSharedUser(userId);
    
    res.status(200).json({
      success: true,
      data: {
        calendar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao remover compartilhamento.',
        code: 'REMOVE_SHARE_ERROR'
      }
    });
  }
};
