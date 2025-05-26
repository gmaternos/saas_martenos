const Child = require('../models/Child');
const Development = require('../models/Development');

// Obter todas as crianças do usuário
exports.getChildren = async (req, res) => {
  try {
    const children = await Child.find({ userId: req.user._id });
    
    res.status(200).json({
      success: true,
      count: children.length,
      data: {
        children
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar crianças.',
        code: 'GET_CHILDREN_ERROR'
      }
    });
  }
};

// Obter uma criança específica
exports.getChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
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
    
    res.status(200).json({
      success: true,
      data: {
        child
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar criança.',
        code: 'GET_CHILD_ERROR'
      }
    });
  }
};

// Criar nova criança
exports.createChild = async (req, res) => {
  try {
    // Adicionar userId ao corpo da requisição
    req.body.userId = req.user._id;
    
    const child = await Child.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        child
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
        message: 'Erro ao criar criança.',
        code: 'CREATE_CHILD_ERROR'
      }
    });
  }
};

// Atualizar criança
exports.updateChild = async (req, res) => {
  try {
    const child = await Child.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!child) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Criança não encontrada.',
          code: 'CHILD_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        child
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
        message: 'Erro ao atualizar criança.',
        code: 'UPDATE_CHILD_ERROR'
      }
    });
  }
};

// Excluir criança
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({
      _id: req.params.id,
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
    
    // Excluir também os marcos de desenvolvimento associados
    await Development.deleteMany({ childId: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir criança.',
        code: 'DELETE_CHILD_ERROR'
      }
    });
  }
};

// Obter idade formatada da criança
exports.getChildAge = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
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
    
    const ageInMonths = child.getAgeInMonths();
    const formattedAge = child.getFormattedAge();
    const developmentStage = child.calculateDevelopmentStage();
    
    res.status(200).json({
      success: true,
      data: {
        ageInMonths,
        formattedAge,
        developmentStage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao calcular idade da criança.',
        code: 'GET_CHILD_AGE_ERROR'
      }
    });
  }
};
