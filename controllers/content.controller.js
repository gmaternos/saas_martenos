const Content = require('../models/content.model');
const User = require('../models/user.model');
const ContentRating = require('../models/content-rating.model');

/**
 * Obter conteúdos recomendados para o usuário atual
 */
exports.getRecommendedContent = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Obter fase materna do usuário
    const { fase_materna } = user;
    
    // Obter preferências do usuário
    const temas_interesse = user.perfil?.preferencias?.temas_interesse || [];
    
    // Obter conteúdos já vistos pelo usuário
    const conteudos_vistos = user.progresso?.conteudos_vistos || [];
    
    // Construir query para recomendação
    const query = {
      fases_aplicaveis: fase_materna,
      status: 'publicado',
      _id: { $nin: conteudos_vistos } // Excluir conteúdos já vistos
    };
    
    // Adicionar filtro por temas de interesse, se houver
    if (temas_interesse.length > 0) {
      query.$or = [
        { categorias: { $in: temas_interesse } },
        { tags: { $in: temas_interesse } }
      ];
    }
    
    // Buscar conteúdos recomendados
    const conteudos = await Content.find(query)
      .sort({ data_publicacao: -1 }) // Ordenar por mais recente
      .skip(skip)
      .limit(parseInt(limit))
      .select('titulo descricao imagem_destaque data_publicacao autor categorias tags tempo_leitura avaliacao_media');
    
    // Contar total de conteúdos
    const total = await Content.countDocuments(query);
    
    return res.status(200).json({
      status: 'success',
      data: {
        conteudos,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter conteúdos recomendados:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao obter conteúdos recomendados',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Obter conteúdo por slug
 */
exports.getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Buscar conteúdo por slug
    const conteudo = await Content.findOne({ slug, status: 'publicado' })
      .populate('relacionados', 'titulo slug imagem_destaque');
    
    if (!conteudo) {
      return res.status(404).json({
        status: 'error',
        message: 'Conteúdo não encontrado'
      });
    }
    
    // Incrementar visualizações
    conteudo.visualizacoes += 1;
    await conteudo.save();
    
    // Se o usuário estiver autenticado, adicionar à lista de conteúdos vistos
    if (req.user) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { 'progresso.conteudos_vistos': conteudo._id } }
      );
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        conteudo
      }
    });
  } catch (error) {
    console.error('Erro ao obter conteúdo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao obter conteúdo',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Buscar conteúdos
 */
exports.searchContent = async (req, res) => {
  try {
    const { q, categoria, fase, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Construir query de busca
    const query = { status: 'publicado' };
    
    // Adicionar termo de busca, se houver
    if (q) {
      query.$text = { $search: q };
    }
    
    // Adicionar filtro por categoria, se houver
    if (categoria) {
      query.categorias = categoria;
    }
    
    // Adicionar filtro por fase materna, se houver
    if (fase) {
      query.fases_aplicaveis = fase;
    }
    
    // Buscar conteúdos
    const conteudos = await Content.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { data_publicacao: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('titulo descricao imagem_destaque data_publicacao autor categorias tags tempo_leitura avaliacao_media');
    
    // Contar total de conteúdos
    const total = await Content.countDocuments(query);
    
    return res.status(200).json({
      status: 'success',
      data: {
        conteudos,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar conteúdos:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar conteúdos',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Avaliar conteúdo
 */
exports.rateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { avaliacao, comentario } = req.body;
    const userId = req.user._id;
    
    // Verificar se o conteúdo existe
    const conteudo = await Content.findById(contentId);
    
    if (!conteudo) {
      return res.status(404).json({
        status: 'error',
        message: 'Conteúdo não encontrado'
      });
    }
    
    // Verificar se o usuário já avaliou este conteúdo
    const existingRating = await ContentRating.findOne({
      usuario: userId,
      conteudo: contentId
    });
    
    if (existingRating) {
      // Atualizar avaliação existente
      existingRating.avaliacao = avaliacao;
      existingRating.comentario = comentario;
      await existingRating.save();
    } else {
      // Criar nova avaliação
      await ContentRating.create({
        usuario: userId,
        conteudo: contentId,
        avaliacao,
        comentario
      });
      
      // Incrementar contador de avaliações
      conteudo.avaliacoes_count += 1;
    }
    
    // Recalcular média de avaliações
    const ratings = await ContentRating.find({ conteudo: contentId });
    const totalRating = ratings.reduce((sum, item) => sum + item.avaliacao, 0);
    conteudo.avaliacao_media = totalRating / ratings.length;
    
    await conteudo.save();
    
    return res.status(200).json({
      status: 'success',
      message: 'Avaliação registrada com sucesso',
      data: {
        avaliacao_media: conteudo.avaliacao_media,
        avaliacoes_count: conteudo.avaliacoes_count
      }
    });
  } catch (error) {
    console.error('Erro ao avaliar conteúdo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao avaliar conteúdo',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};
