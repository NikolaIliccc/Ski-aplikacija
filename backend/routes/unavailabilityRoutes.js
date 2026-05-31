const router = require("express").Router();

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ADD MY UNAVAILABILITY - instruktor označava da je zauzet
router.post(
  "/my",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const {
        unavailable_date,
        start_time,
        end_time,
        reason
      } = req.body;

      if (!unavailable_date || !start_time || !end_time) {
        return res.status(400).json({
          message: "Datum, početak i kraj zauzetosti su obavezni."
        });
      }

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE user_id = $1",
        [userId]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const instructorId = instructorResult.rows[0].id;

      const overlapLessons = await pool.query(
        `SELECT *
         FROM lessons
         WHERE instructor_id = $1
         AND lesson_date::date = $2::date
         AND status = 'scheduled'
         AND (
           start_time < $4::time
           AND end_time > $3::time
         )`,
        [instructorId, unavailable_date, start_time, end_time]
      );

      if (overlapLessons.rows.length > 0) {
        return res.status(400).json({
          message: "Ne možete označiti zauzetost jer već imate čas u tom terminu."
        });
      }

      const overlapUnavailable = await pool.query(
        `SELECT *
         FROM instructor_unavailability
         WHERE instructor_id = $1
         AND unavailable_date::date = $2::date
         AND (
           start_time < $4::time
           AND end_time > $3::time
         )`,
        [instructorId, unavailable_date, start_time, end_time]
      );

      if (overlapUnavailable.rows.length > 0) {
        return res.status(400).json({
          message: "Već imate označenu zauzetost u tom terminu."
        });
      }

      const newBusyBlock = await pool.query(
        `INSERT INTO instructor_unavailability
        (
          instructor_id,
          unavailable_date,
          start_time,
          end_time,
          reason
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [
          instructorId,
          unavailable_date,
          start_time,
          end_time,
          reason || null
        ]
      );

      res.json({
        message: "Zauzetost je uspešno dodata.",
        busy: newBusyBlock.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET MY UNAVAILABILITY - instruktor vidi svoju zauzetost
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE user_id = $1",
        [userId]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const instructorId = instructorResult.rows[0].id;

      const busyBlocks = await pool.query(
        `SELECT *
         FROM instructor_unavailability
         WHERE instructor_id = $1
         ORDER BY unavailable_date ASC, start_time ASC`,
        [instructorId]
      );

      res.json(busyBlocks.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE MY UNAVAILABILITY
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const busyId = req.params.id;

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE user_id = $1",
        [userId]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const instructorId = instructorResult.rows[0].id;

      const deletedBusy = await pool.query(
        `DELETE FROM instructor_unavailability
         WHERE id = $1 AND instructor_id = $2
         RETURNING *`,
        [busyId, instructorId]
      );

      if (deletedBusy.rows.length === 0) {
        return res.status(404).json({
          message: "Zauzetost nije pronađena."
        });
      }

      res.json({
        message: "Zauzetost je obrisana.",
        busy: deletedBusy.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET ALL UNAVAILABILITY - booker/admin vidi sve zauzetosti
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const busyBlocks = await pool.query(
        `SELECT
          instructor_unavailability.*,
          users.name AS instructor_name,
          users.email AS instructor_email
        FROM instructor_unavailability
        JOIN instructors
        ON instructor_unavailability.instructor_id = instructors.id
        JOIN users
        ON instructors.user_id = users.id
        ORDER BY unavailable_date ASC, start_time ASC`
      );

      res.json(busyBlocks.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;