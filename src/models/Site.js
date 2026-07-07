const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Site', SiteSchema);
