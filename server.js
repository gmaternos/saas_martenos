require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const childrenRoutes = require('./src/routes/children');
const contentRoutes = require('./src/routes/content');
const calendarRoutes = require('./src/routes/calendar');
const developmentRoutes = require('./src/routes/development');
const communityRoutes = require('./src/routes/community');

// Inicializar app
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/development', developmentRoutes);
app.use('/api/community', communityRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Erro interno do servidor',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
      code: 'NOT_FOUND'
    }
  });
});

// Conexão com o banco de dados e inicialização do servidor
const PORT = process.env.PORT || 5000;

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    // A string de conexão será definida no arquivo .env
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectado com sucesso');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    // Encerrar processo com falha
    process.exit(1);
  }
};

// Iniciar servidor apenas após conectar ao banco de dados
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  });
}

// Exportar app para testes
module.exports = app;
