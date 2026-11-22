import AuditLog from '../models/AuditLog.js';

/**
 * Records an audit log entry for administrative/critical actions.
 * Automatically strips sensitive information such as passwords, tokens, and secrets.
 */
export async function logAudit({ req, storeId, action, resourceType, resourceId, details = {} }) {
  try {
    const actorId = req?.user?._id || null;
    const actorEmail = req?.user?.email || '';
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '';

    // Sanitize details to avoid recording any passwords or tokens
    const sanitizedDetails = { ...details };
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];
    for (const key of Object.keys(sanitizedDetails)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        delete sanitizedDetails[key];
      }
    }

    await AuditLog.create({
      store: storeId || req?.store?._id || null,
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId: String(resourceId || ''),
      details: sanitizedDetails,
      ip: typeof ip === 'string' ? ip.split(',')[0].trim() : '',
    });
  } catch (err) {
    // Non-blocking error logging
    console.error('[AuditLogger] Failed to write audit log:', err.message);
  }
}
