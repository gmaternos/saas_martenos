const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções temporárias para as rotas de conteúdo
const getAllContent = (req, res) => {
  res.status(200).json({ message: "Lista de conteúdos (função temporária)", content: [] });
};

const getContentById = (req, res) => {
  res.status(200).json({ message: "Detalhes do conteúdo (função temporária)", id: req.params.id });
};

const rateContent = (req, res) => {
  res.status(200).json({ message: "Avaliação registrada (função temporária)", data: req.body });
};

// Rotas de conteúdo
router.get('/', getAllContent);
router.get('/:id', getContentById);
router.post('/:id/rate', authMiddleware.verifyToken, rateContent);

module.exports = router;
