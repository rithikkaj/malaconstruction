const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'siteadmin', 'worker'], required: true },
  site_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
