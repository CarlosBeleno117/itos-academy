const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ITOS Academy API',
      version: '1.0.0',
      description:
        'Documentación de la API REST para la aplicación web ITOS Academy.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor local de desarrollo',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;