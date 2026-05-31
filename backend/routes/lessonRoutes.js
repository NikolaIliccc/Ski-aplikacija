const router = require("express").Router();

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET ALL LESSONS - samo admin/booker
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const lessons = await pool.query(
        `SELECT
          lessons.id,
          lessons.request_id,
          lessons.instructor_id,
          lessons.lesson_type,
          lessons.lesson_date,
          lessons.start_time,
          lessons.end_time,
          lessons.status,

          lesson_requests.client_first_name,
          lesson_requests.client_last_name,
          lesson_requests.client_age,
          lesson_requests.client_phone,
          lesson_requests.client_skill_level,
          lesson_requests.first_time,
          lesson_requests.parent_name,
          lesson_requests.parent_phone,
          lesson_requests.lesson_mode,
          lesson_requests.group_package,
          lesson_requests.note,

          instructor_user.name AS instructor_name,
          instructor_user.email AS instructor_email

        FROM lessons

        JOIN lesson_requests
        ON lessons.request_id = lesson_requests.id

        JOIN instructors
        ON lessons.instructor_id = instructors.id

        JOIN users AS instructor_user
        ON instructors.user_id = instructor_user.id

        ORDER BY lessons.lesson_date ASC, lessons.start_time ASC`
      );

      res.json(lessons.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET MY LESSONS - samo instructor
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
          message: "Instruktor nije pronađen za ovog korisnika."
        });
      }

      const instructorId = instructorResult.rows[0].id;

      const lessons = await pool.query(
        `SELECT
          lessons.id,
          lessons.request_id,
          lessons.instructor_id,
          lessons.lesson_type,
          lessons.lesson_date,
          lessons.start_time,
          lessons.end_time,
          lessons.status,

          lesson_requests.client_first_name,
          lesson_requests.client_last_name,
          lesson_requests.client_age,
          lesson_requests.client_phone,
          lesson_requests.client_skill_level,
          lesson_requests.first_time,
          lesson_requests.parent_name,
          lesson_requests.parent_phone,
          lesson_requests.lesson_mode,
          lesson_requests.group_package,
          lesson_requests.note

        FROM lessons

        JOIN lesson_requests
        ON lessons.request_id = lesson_requests.id

        WHERE lessons.instructor_id = $1

        ORDER BY lessons.lesson_date ASC, lessons.start_time ASC`,
        [instructorId]
      );

      res.json(lessons.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET CLIENT LESSONS - client vidi svoje odobrene časove
router.get(
  "/client/my",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const lessons = await pool.query(
        `SELECT
          lessons.id,
          lessons.request_id,
          lessons.lesson_type,
          lessons.lesson_date,
          lessons.start_time,
          lessons.end_time,
          lessons.status,

          lesson_requests.client_first_name,
          lesson_requests.client_last_name,
          lesson_requests.client_age,
          lesson_requests.client_phone,
          lesson_requests.client_skill_level,
          lesson_requests.first_time,
          lesson_requests.parent_name,
          lesson_requests.parent_phone,
          lesson_requests.lesson_mode,
          lesson_requests.group_package,
          lesson_requests.note,

          instructor_user.name AS instructor_name,
          instructor_user.email AS instructor_email

        FROM lessons

        JOIN lesson_requests
        ON lessons.request_id = lesson_requests.id

        JOIN instructors
        ON lessons.instructor_id = instructors.id

        JOIN users AS instructor_user
        ON instructors.user_id = instructor_user.id

        WHERE lesson_requests.user_id = $1

        ORDER BY lessons.lesson_date ASC, lessons.start_time ASC`,
        [req.user.id]
      );

      res.json(lessons.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// UPDATE LESSON - izmena zakazanog časa, samo admin/booker
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const lessonId = req.params.id;

      const {
        instructor_id,
        lesson_date,
        start_time
      } = req.body;

      if (!instructor_id || !lesson_date || !start_time) {
        return res.status(400).json({
          message: "Instruktor, datum i vreme su obavezni."
        });
      }

      const endTimeResult = await pool.query(
        "SELECT ($1::time + interval '60 minutes')::time AS end_time",
        [start_time]
      );

      const endTime = endTimeResult.rows[0].end_time;

      const busyResult = await pool.query(
        `SELECT *
         FROM lessons
         WHERE instructor_id = $1
         AND lesson_date = $2
         AND id != $3
         AND status = 'scheduled'
         AND (
           start_time < $5
           AND end_time > $4
         )`,
        [instructor_id, lesson_date, lessonId, start_time, endTime]
      );

      if (busyResult.rows.length > 0) {
        return res.status(400).json({
          message: "Instruktor je zauzet u tom terminu."
        });
      }

      const updatedLesson = await pool.query(
        `UPDATE lessons
         SET instructor_id = $1,
             lesson_date = $2,
             start_time = $3,
             end_time = $4
         WHERE id = $5
         RETURNING *`,
        [
          instructor_id,
          lesson_date,
          start_time,
          endTime,
          lessonId
        ]
      );

      if (updatedLesson.rows.length === 0) {
        return res.status(404).json({
          message: "Čas nije pronađen."
        });
      }

      res.json({
        message: "Čas je uspešno izmenjen.",
        lesson: updatedLesson.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE LESSON - otkazivanje časa = brisanje iz baze, samo admin/booker
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const lessonId = req.params.id;

      const deletedLesson = await pool.query(
        `DELETE FROM lessons
         WHERE id = $1
         RETURNING *`,
        [lessonId]
      );

      if (deletedLesson.rows.length === 0) {
        return res.status(404).json({
          message: "Čas nije pronađen."
        });
      }

      res.json({
        message: "Čas je otkazan i obrisan.",
        lesson: deletedLesson.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;