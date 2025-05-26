const Comment = require('../models/Comment');

// Obter um comentário específico
exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', 'name profile.avatar');
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Comentário não encontrado.',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        comment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar comentário.',
        code: 'GET_COMMENT_ERROR'
      }
    });
  }
};

// Atualizar comentário
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Comentário não encontrado.',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o autor do comentário ou um administrador
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para editar este comentário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Atualizar apenas o conteúdo
    comment.content = req.body.content;
    comment.isEdited = true;
    
    await comment.save();
    
    // Buscar comentário atualizado com dados do usuário
    const updatedComment = await Comment.findById(req.params.id)
      .populate('userId', 'name profile.avatar');
    
    res.status(200).json({
      success: true,
      data: {
        comment: updatedComment
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
        message: 'Erro ao atualizar comentário.',
        code: 'UPDATE_COMMENT_ERROR'
      }
    });
  }
};

// Excluir comentário
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Comentário não encontrado.',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o autor do comentário ou um administrador
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para excluir este comentário.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Soft delete
    await comment.markAsDeleted();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir comentário.',
        code: 'DELETE_COMMENT_ERROR'
      }
    });
  }
};

// Curtir comentário
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Comentário não encontrado.',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário já curtiu o comentário
    const alreadyLiked = comment.likedBy.includes(req.user._id);
    
    if (alreadyLiked) {
      // Remover like
      await comment.removeLike(req.user._id);
    } else {
      // Adicionar like
      await comment.addLike(req.user._id);
    }
    
    res.status(200).json({
      success: true,
      data: {
        likes: comment.likes,
        liked: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao curtir comentário.',
        code: 'LIKE_COMMENT_ERROR'
      }
    });
  }
};

// Sinalizar comentário
exports.flagComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Comentário não encontrado.',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }
    
    // Marcar como sinalizado
    await comment.markAsFlagged();
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Comentário sinalizado com sucesso.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao sinalizar comentário.',
        code: 'FLAG_COMMENT_ERROR'
      }
    });
  }
};
