const Development = require('../models/Development');
const Child = require('../models/Child');

// Obter todos os marcos de desenvolvimento de uma criança
exports.getMilestones = async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    // Buscar marcos de desenvolvimento
    const milestones = await Development.find({ childId });
    
    res.status(200).json({
      success: true,
      count: milestones.length,
      data: {
        milestones
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar marcos de desenvolvimento.',
        code: 'GET_MILESTONES_ERROR'
      }
    });
  }
};

// Obter um marco de desenvolvimento específico
exports.getMilestone = async (req, res) => {
  try {
    const { childId, id } = req.params;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    // Buscar marco de desenvolvimento
    const milestone = await Development.findOne({
      _id: id,
      childId
    });
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Marco de desenvolvimento não encontrado.',
          code: 'MILESTONE_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        milestone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar marco de desenvolvimento.',
        code: 'GET_MILESTONE_ERROR'
      }
    });
  }
};

// Criar novo marco de desenvolvimento
exports.createMilestone = async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    // Adicionar childId ao corpo da requisição
    req.body.childId = childId;
    
    const milestone = await Development.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        milestone
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
        message: 'Erro ao criar marco de desenvolvimento.',
        code: 'CREATE_MILESTONE_ERROR'
      }
    });
  }
};

// Atualizar marco de desenvolvimento
exports.updateMilestone = async (req, res) => {
  try {
    const { childId, id } = req.params;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    const milestone = await Development.findOneAndUpdate(
      {
        _id: id,
        childId
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Marco de desenvolvimento não encontrado.',
          code: 'MILESTONE_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        milestone
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
        message: 'Erro ao atualizar marco de desenvolvimento.',
        code: 'UPDATE_MILESTONE_ERROR'
      }
    });
  }
};

// Registrar marco de desenvolvimento como alcançado
exports.achieveMilestone = async (req, res) => {
  try {
    const { childId, id } = req.params;
    const { achievedDate, notes, evidence } = req.body;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    const milestone = await Development.findOneAndUpdate(
      {
        _id: id,
        childId
      },
      {
        achievedDate: achievedDate || Date.now(),
        notes,
        ...(evidence && { evidence })
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Marco de desenvolvimento não encontrado.',
          code: 'MILESTONE_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        milestone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao registrar marco de desenvolvimento.',
        code: 'ACHIEVE_MILESTONE_ERROR'
      }
    });
  }
};

// Excluir marco de desenvolvimento
exports.deleteMilestone = async (req, res) => {
  try {
    const { childId, id } = req.params;
    
    // Verificar se a criança existe e pertence ao usuário
    const child = await Child.findOne({
      _id: childId,
      userId: req.user._id
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    const milestone = await Development.findOneAndDelete({
      _id: id,
      childId
    });
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Marco de desenvolvimento não encontrado.',
          code: 'MILESTONE_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir marco de desenvolvimento.',
        code: 'DELETE_MILESTONE_ERROR'
      }
    });
  }
};
