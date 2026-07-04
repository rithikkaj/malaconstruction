require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Route imports
const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const adminsRoutes = require('./routes/admins');
const materialsRoutes = require('./routes/materials');
const workersRoutes = require('./routes/workers');
const expensesRoutes = require('./routes/expenses');
const reportsRoutes = require('./routes/reports');

function createApp() {
  const app = express();

  // Port is irrelevant in serverless

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin:
        process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ||
        ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/admins', adminsRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/workers', workersRoutes);
  app.use('/api/expenses', expensesRoutes);
  app.use('/api/reports', reportsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Mala Construction API is running',
      timestamp: new Date(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
  });

  // Error handler
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
  });

  return app;
}

module.exports = { createApp };


