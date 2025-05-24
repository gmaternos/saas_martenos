const admin = require('../config/firebase-admin');
const User = require('../models/user.model');

/**
 * Registrar novo usuário
 */
exports.register = async (req, res) => {
  try {
    const { nome, email, fase_materna } = req.body;
    
    // Verificar se o usuário já existe no Firebase
    const firebaseUser = await admin.auth().getUserByEmail(email)
      .catch(() => null);
    
    if (!firebaseUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Usuário não encontrado no Firebase. Registre-se primeiro pelo frontend.'
      });
    }
    
    // Verificar se o usuário já existe no banco de dados
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Usuário já registrado'
      });
    }
    
    // Criar novo usuário no banco de dados
    const newUser = new User({
      firebase_uid: firebaseUser.uid,
      nome,
      email,
      fase_materna
    });
    
    await newUser.save();
    
    return res.status(201).json({
      status: 'success',
      message: 'Usuário registrado com sucesso',
      data: {
        user: {
          id: newUser._id,
          nome: newUser.nome,
          email: newUser.email,
          fase_materna: newUser.fase_materna
        }
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao registrar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Obter perfil do usuário atual
 */
exports.getProfile = async (req, res) => {
  try {
    // O usuário já está disponível em req.user graças ao middleware de autenticação
    const user = req.user;
    
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          fase_materna: user.fase_materna,
          perfil: user.perfil,
          progresso: user.progresso
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao obter perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Atualizar perfil do usuário
 */
exports.updateProfile = async (req, res) => {
  try {
    const { nome, fase_materna, perfil } = req.body;
    const userId = req.user._id;
    
    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          nome: nome,
          fase_materna: fase_materna,
          'perfil.foto': perfil?.foto,
          'perfil.data_nascimento': perfil?.data_nascimento,
          'perfil.filhos': perfil?.filhos,
          'perfil.preferencias': perfil?.preferencias
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Perfil atualizado com sucesso',
      data: {
        user: {
          id: updatedUser._id,
          nome: updatedUser.nome,
          email: updatedUser.email,
          fase_materna: updatedUser.fase_materna,
          perfil: updatedUser.perfil
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};
