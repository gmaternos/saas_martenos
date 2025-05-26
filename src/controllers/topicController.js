const Topic = require('../models/Topic');
const Comment = require('../models/Comment');

// Obter todos os tópicos
exports.getTopics = async (req, res) => {
  try {
    // Construir query
    let query = { status: { $ne: 'deleted' } };
    
    // Filtrar por categoria
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filtrar por tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    // Filtrar por status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Ordenação
    let sort = {};
    if (req.query.sort) {
      if (req.query.sort === 'latest') {
        sort = { createdAt: -1 };
      } else if (req.query.sort === 'oldest') {
        sort = { createdAt: 1 };
      } else if (req.query.sort === 'popular') {
        sort = { views: -1 };
      } else if (req.query.sort === 'activity') {
        sort = { lastActivity: -1 };
      }
    } else {
      // Padrão: ordenar por última atividade
      sort = { lastActivity: -1 };
    }
    
    const total = await Topic.countDocuments(query);
    
    const topics = await Topic.find(query)
      .populate('userId', 'name profile.avatar')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: topics.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        topics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar tópicos.',
        code: 'GET_TOPICS_ERROR'
      }
    });
  }
};

// Obter um tópico específico
exports.getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('userId', 'name profile.avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'name profile.avatar'
        },
        match: { status: 'active', parentId: null },
        options: { sort: { createdAt: 1 } }
      });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Incrementar visualizações
    await topic.incrementViews();
    
    res.status(200).json({
      success: true,
      data: {
        topic
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar tópico.',
        code: 'GET_TOPIC_ERROR'
      }
    });
  }
};

// Criar novo tópico
exports.createTopic = async (req, res) => {
  try {
    // Adicionar userId ao corpo da requisição
    req.body.userId = req.user._id;
    
    const topic = await Topic.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        topic
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
        message: 'Erro ao criar tópico.',
        code: 'CREATE_TOPIC_ERROR'
      }
    });
  }
};

// Atualizar tópico
exports.updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o autor do tópico ou um administrador
    if (topic.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para editar este tópico.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Não permitir alterar o userId
    if (req.body.userId) {
      delete req.body.userId;
    }
    
    const updatedTopic = await Topic.findByIdAndUpdate(
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
        topic: updatedTopic
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
        message: 'Erro ao atualizar tópico.',
        code: 'UPDATE_TOPIC_ERROR'
      }
    });
  }
};

// Excluir tópico
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário é o autor do tópico ou um administrador
    if (topic.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para excluir este tópico.',
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    // Excluir o tópico
    await topic.remove();
    
    // Excluir todos os comentários associados
    await Comment.deleteMany({ 
      entityId: req.params.id,
      entityType: 'topic'
    });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao excluir tópico.',
        code: 'DELETE_TOPIC_ERROR'
      }
    });
  }
};

// Curtir tópico
exports.likeTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Verificar se o usuário já curtiu o tópico
    const alreadyLiked = topic.likedBy.includes(req.user._id);
    
    if (alreadyLiked) {
      // Remover like
      await topic.removeLike(req.user._id);
    } else {
      // Adicionar like
      await topic.addLike(req.user._id);
    }
    
    res.status(200).json({
      success: true,
      data: {
        likes: topic.likes,
        liked: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao curtir tópico.',
        code: 'LIKE_TOPIC_ERROR'
      }
    });
  }
};

// Obter comentários de um tópico
exports.getTopicComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o tópico existe
    const topic = await Topic.findById(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Buscar comentários
    const comments = await Comment.find({
      entityId: id,
      entityType: 'topic',
      parentId: null,
      status: 'active'
    })
      .populate('userId', 'name profile.avatar')
      .sort({ createdAt: 1 });
    
    // Para cada comentário, buscar respostas
    for (let comment of comments) {
      comment._doc.replies = await Comment.find({
        parentId: comment._id,
        status: 'active'
      })
        .populate('userId', 'name profile.avatar')
        .sort({ createdAt: 1 });
    }
    
    res.status(200).json({
      success: true,
      count: comments.length,
      data: {
        comments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar comentários.',
        code: 'GET_COMMENTS_ERROR'
      }
    });
  }
};

// Adicionar comentário a um tópico
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;
    
    // Verificar se o tópico existe
    const topic = await Topic.findById(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tópico não encontrado.',
          code: 'TOPIC_NOT_FOUND'
        }
      });
    }
    
    // Se for uma resposta, verificar se o comentário pai existe
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Comentário pai não encontrado.',
            code: 'PARENT_COMMENT_NOT_FOUND'
          }
        });
      }
    }
    
    // Criar comentário
    const comment = await Comment.create({
      entityId: id,
      entityType: 'topic',
      userId: req.user._id,
      content,
      parentId
    });
    
    // Atualizar última atividade do tópico
    await topic.updateLastActivity();
    
    // Buscar comentário com dados do usuário
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name profile.avatar');
    
    res.status(201).json({
      success: true,
      data: {
        comment: populatedComment
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
        message: 'Erro ao adicionar comentário.',
        code: 'ADD_COMMENT_ERROR'
      }
    });
  }
};
