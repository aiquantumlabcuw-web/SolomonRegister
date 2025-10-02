const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  user: { type: String }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
