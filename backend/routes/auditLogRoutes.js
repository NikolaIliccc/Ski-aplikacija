const router = require("express").Router();

const pool = require("../db/db");

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");


// =====================================================
// GET AUDIT LOGS
// Samo administrator
// =====================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        action,
        role,
        search
      } = req.query;


      const values = [];

      const conditions = [];


      if (
        action &&
        action !== "all"
      ) {
        values.push(action);

        conditions.push(
          `audit_logs.action = $${values.length}`
        );
      }


      if (
        role &&
        role !== "all"
      ) {
        values.push(role);

        conditions.push(
          `users.role = $${values.length}`
        );
      }


      if (
        search &&
        search.trim()
      ) {
        values.push(
          `%${search.trim()}%`
        );

        conditions.push(
          `(
            users.name ILIKE $${values.length}
            OR
            users.email ILIKE $${values.length}
            OR
            audit_logs.details ILIKE $${values.length}
            OR
            audit_logs.action ILIKE $${values.length}
          )`
        );
      }


      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";


      const result =
        await pool.query(
          `
          SELECT
            audit_logs.id,
            audit_logs.user_id,
            audit_logs.action,
            audit_logs.entity_type,
            audit_logs.entity_id,
            audit_logs.details,
            audit_logs.ip_address,
            audit_logs.created_at,

            users.name AS user_name,
            users.email AS user_email,
            users.role AS user_role

          FROM audit_logs

          LEFT JOIN users
            ON audit_logs.user_id = users.id

          ${whereClause}

          ORDER BY
            audit_logs.created_at DESC

          LIMIT 500
          `,
          values
        );


      res.json(
        result.rows
      );

    } catch (err) {
      console.log(
        "GET AUDIT LOG ERROR:",
        err.message
      );

      res.status(500).json({
        error:
          err.message
      });
    }
  }
);


module.exports = router;