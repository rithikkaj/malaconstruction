const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaconstruction';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

db.once('open', () => {
  console.log('✅ MongoDB connected successfully');
});

module.exports = { mongoose, db };
