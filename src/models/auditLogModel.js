const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['create', 'update', 'delete', 'login', 'logout']
  },
  entity: {
    type: String,
    required: [true, 'Entity is required'],
    enum: ['user', 'product', 'order']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Object
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);