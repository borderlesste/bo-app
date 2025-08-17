const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Borderless Techno - Development', 
    version: '1.0.0',
    status: 'active',
    environment: 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

// Health check para autenticación
app.get('/api/auth/profile', (req, res) => {
  res.status(401).json({ success: false, message: 'No authenticated user' });
});

// Projects endpoint
app.get('/api/projects', (req, res) => {
  res.json({ success: true, projects: [] });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
});