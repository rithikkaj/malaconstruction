const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  name: { type: String, required: true },
  profession: { type: String },
  daily_wage: { type: Number },
  days_worked: { type: Number },
  work_period_start: { type: Date },
  work_period_end: { type: Date },
  total_amount: { type: Number },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Worker', WorkerSchema);
