const pool = require("../db/db");

const logSecurityEvent = async ({
  user_id = null,
  email = null,
  action,
  status,
  ip_address = null,
  user_agent = null,
  details = null
}) => {
  try {
    await pool.query(
      `INSERT INTO security_logs
       (user_id, email, action, status, ip_address, user_agent, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, email, action, status, ip_address, user_agent, details]
    );
  } catch (err) {
    console.log("Security log error:", err.message);
  }
};

module.exports = logSecurityEvent;