const pool = require("../db/db");

const getIpAddress = (req) => {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded
      .split(",")[0]
      .trim();
  }

  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    null
  );
};


const logActivity = async (
  {
    userId = null,
    action,
    entityType = null,
    entityId = null,
    details = null,
    ipAddress = null
  },
  db = pool
) => {
  try {
    await db.query(
      `
      INSERT INTO audit_logs
      (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6
      )
      `,
      [
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress
      ]
    );

  } catch (err) {
    // Audit log ne sme da sruši glavnu funkcionalnost
    console.log(
      "AUDIT LOG ERROR:",
      err.message
    );
  }
};


module.exports = {
  logActivity,
  getIpAddress
};