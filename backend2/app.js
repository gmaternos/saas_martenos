const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const contentRoutes = require('./routes/content.routes');
const toolRoutes = require('./routes/tool.routes');

// Inicializar app
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tools', toolRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API Guias Maternos funcionando!' });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guias-maternos', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB', err);
  });

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
