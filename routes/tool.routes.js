const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções temporárias para as rotas de ferramentas
const getAllTools = (req, res) => {
  res.status(200).json({ message: "Lista de ferramentas (função temporária)", tools: [] });
};

const getToolById = (req, res) => {
  res.status(200).json({ message: "Detalhes da ferramenta (função temporária)", id: req.params.id });
};

const saveToolData = (req, res) => {
  res.status(200).json({ message: "Dados da ferramenta salvos (função temporária)", data: req.body });
};

// Rotas de ferramentas
router.get('/', getAllTools);
router.get('/:id', getToolById);
router.post('/data', authMiddleware.verifyToken, saveToolData);

module.exports = router;
