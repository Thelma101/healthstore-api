const AuditLog = require('../models/auditLogModel');

const logAdminAction = (action, entity) => {
  return async (req, res, next) => {
    try {
      await AuditLog.create({
        action,
        entity,
        entityId: req.params.id || null,
        admin: req.user.id,
        metadata: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      next();
    } catch (err) {
      console.error('Audit log failed:', err);
      next(); // Don't block the request if logging fails
    }
  };
};

module.exports = logAdminAction;