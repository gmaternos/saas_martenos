const Content = require('../models/Content');

// Obter todos os conteúdos
exports.getAllContent = async (req, res) => {
  try {
    // Construir query
    let query = { status: 'published' };
    
    // Filtrar por tipo
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filtrar por categoria
    if (req.query.category) {
      query.categories = req.query.category;
    }
    
    // Filtrar por tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    // Filtrar por idioma
    if (req.query.language) {
      query.language = req.query.language;
    } else {
      // Padrão: idioma do usuário ou português
      query.language = req.user?.profile?.language || 'pt';
    }
    
    // Filtrar por faixa etária
    if (req.query.ageInMonths) {
      const ageInMonths = parseInt(req.query.ageInMonths);
      query.$or = [
        { 'ageRelevance.min': { $lte: ageInMonths }, 'ageRelevance.max': { $gte: ageInMonths } },
        { ageRelevance: { $size: 0 } }
      ];
    }
    
    // Filtrar por conteúdo premium
    if (req.query.premium) {
      query.premium = req.query.premium === 'true';
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Ordenação
    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? 
        req.query.sort.substring(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      // Padrão: ordenar por data de publicação (mais recente primeiro)
      sort = { publishDate: -1 };
    }
    
    const total = await Content.countDocuments(query);
    
    const content = await Content.find(query)
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Verificar acesso a conteúdo premium
    if (req.user) {
      const hasPremiumAccess = req.user.subscription.plan !== 'free' && 
        req.user.subscription.status === 'active';
      
      // Filtrar conteúdo premium se o usuário não tiver acesso
      if (!hasPremiumAccess) {
        content.forEach(item => {
          if (item.premium) {
            item.content = item.content.substring(0, 500) + '... [Conteúdo premium]';
          }
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: content.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        content
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar conteúdos.',
        code: 'GET_CONTENT_ERROR'
      }
    });
  }
};

// Obter um conteúdo específico
exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id }
      ],
      status: 'published'
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Conteúdo não encontrado.',
          code: 'CONTENT_NOT_FOUND'
        }
      });
    }
    
    // Verificar acesso a conteúdo premium
    if (content.premium && req.user) {
      const hasPremiumAccess = req.user.subscription.plan !== 'free' && 
        req.user.subscription.status === 'active';
      
      if (!hasPremiumAccess) {
        content.content = content.content.substring(0, 500) + '... [Conteúdo premium]';
      }
    }
    
    // Incrementar visualizações
    await content.incrementViews();
    
    res.status(200).json({
      success: true,
      data: {
        content
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar conteúdo.',
        code: 'GET_CONTENT_ERROR'
      }
    });
  }
};

// Obter conteúdos recomendados
exports.getRecommendedContent = async (req, res) => {
  try {
    // Parâmetros para recomendação
    const { childId, limit = 5 } = req.query;
    
    let ageInMonths;
    let categories = [];
    
    // Se childId for fornecido, buscar idade da criança
    if (childId) {
      const child = await Child.findOne({
        _id: childId,
        userId: req.user._id
      });
      
      if (child) {
        ageInMonths = child.getAgeInMonths();
        
        // Adicionar categorias baseadas no estágio de desenvolvimento
        const stage = child.calculateDevelopmentStage();
        if (stage === 'bebê') {
          categories.push('desenvolvimento infantil', 'amamentação', 'sono do bebê');
        } else if (stage === 'criança pequena') {
          categories.push('desenvolvimento infantil', 'educação', 'comportamento');
        } else if (stage === 'pré-escolar') {
          categories.push('educação', 'socialização', 'atividades');
        } else if (stage === 'criança em idade escolar') {
          categories.push('educação', 'atividades', 'saúde');
        }
      }
    }
    
    // Construir query
    let query = { 
      status: 'published',
      language: req.user?.profile?.language || 'pt'
    };
    
    // Filtrar por faixa etária se disponível
    if (ageInMonths) {
      query.$or = [
        { 'ageRelevance.min': { $lte: ageInMonths }, 'ageRelevance.max': { $gte: ageInMonths } },
        { ageRelevance: { $size: 0 } }
      ];
    }
    
    // Filtrar por categorias se disponíveis
    if (categories.length > 0) {
      query.categories = { $in: categories };
    }
    
    // Verificar acesso a conteúdo premium
    const hasPremiumAccess = req.user.subscription.plan !== 'free' && 
      req.user.subscription.status === 'active';
    
    if (!hasPremiumAccess) {
      query.premium = false;
    }
    
    // Buscar conteúdos recomendados
    const content = await Content.find(query)
      .sort({ publishDate: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: content.length,
      data: {
        content
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao buscar conteúdos recomendados.',
        code: 'GET_RECOMMENDED_CONTENT_ERROR'
      }
    });
  }
};

// Curtir um conteúdo
exports.likeContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Conteúdo não encontrado.',
          code: 'CONTENT_NOT_FOUND'
        }
      });
    }
    
    // Incrementar likes
    await content.incrementLikes();
    
    res.status(200).json({
      success: true,
      data: {
        likes: content.likes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro ao curtir conteúdo.',
        code: 'LIKE_CONTENT_ERROR'
      }
    });
  }
};
