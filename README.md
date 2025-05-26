# Guias Maternos - Backend API

Backend do SaaS Guias Maternos, desenvolvido com Node.js, Express e MongoDB.

## Requisitos

- Node.js 16+
- npm ou yarn
- MongoDB (local ou Atlas)

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Build para Produção

```bash
npm start
```

## Deploy no Render.com

1. Crie uma conta no Render.com (https://render.com)
2. Conecte seu repositório Git
3. Configure as variáveis de ambiente
4. Deploy!

## Estrutura do Projeto

- `src/config/`: Configurações da aplicação
- `src/controllers/`: Controladores para manipulação de requisições
- `src/middlewares/`: Middlewares para processamento de requisições
- `src/models/`: Modelos de dados (Mongoose)
- `src/routes/`: Rotas da API
- `src/services/`: Serviços para lógica de negócios
- `src/utils/`: Funções utilitárias
