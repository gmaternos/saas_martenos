const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções temporárias para as rotas de marcos de desenvolvimento
const getAllMilestones = (req, res) => {
  res.status(200).json({ message: "Lista de marcos de desenvolvimento (função temporária)", milestones: [] });
};

const getMilestoneById = (req, res) => {
  res.status(200).json({ message: "Detalhes do marco (função temporária)", id: req.params.id });
};

// Rotas de marcos de desenvolvimento
router.get('/', getAllMilestones);
router.get('/:id', getMilestoneById);

module.exports = router;
