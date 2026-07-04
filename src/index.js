require('dotenv').config();
const { testConnection } = require('./config/db');
const { seedDatabase } = require('./config/seed');
const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;

// Start server (local dev)
const startServer = async () => {
  await testConnection();
  await seedDatabase();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 Mala Construction API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

