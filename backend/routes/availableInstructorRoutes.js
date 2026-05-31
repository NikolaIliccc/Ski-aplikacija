const router = require("express").Router();

const pool = require("../db/db");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const isInstructorBusy = async (
  instructorId,
  date,
  startTime,
  endTime
) => {
  const lessonResult = await pool.query(
    `SELECT *
     FROM lessons
     WHERE instructor_id = $1
     AND lesson_date::date = $2::date
     AND status = 'scheduled'
     AND (
       start_time < $4::time
       AND end_time > $3::time
     )`,
    [instructorId, date, startTime, endTime]
  );

  if (lessonResult.rows.length > 0) {
    return true;
  }

  const unavailableResult = await pool.query(
    `SELECT *
     FROM instructor_unavailability
     WHERE instructor_id = $1
     AND unavailable_date::date = $2::date
     AND (
       start_time < $4::time
       AND end_time > $3::time
     )`,
    [instructorId, date, startTime, endTime]
  );

  return unavailableResult.rows.length > 0;
};

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const {
        lesson_type,
        lesson_date,
        start_time,
        end_time
      } = req.query;

      if (
        !lesson_type ||
        !lesson_date ||
        !start_time ||
        !end_time
      ) {
        return res.status(400).json({
          message: "Nedostaju podaci."
        });
      }

      let instructorsResult;

      if (lesson_type === "ski") {
        instructorsResult = await pool.query(
          `SELECT
            instructors.*,
            users.name,
            users.email
          FROM instructors
          JOIN users
          ON instructors.user_id = users.id
          WHERE ski_license = true`
        );
      } else {
        instructorsResult = await pool.query(
          `SELECT
            instructors.*,
            users.name,
            users.email
          FROM instructors
          JOIN users
          ON instructors.user_id = users.id
          WHERE snowboard_license = true`
        );
      }

      const availableInstructors = [];

      for (const instructor of instructorsResult.rows) {
        const busy = await isInstructorBusy(
          instructor.id,
          lesson_date,
          start_time,
          end_time
        );

        if (!busy) {
          availableInstructors.push(instructor);
        }
      }

      res.json(availableInstructors);
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);

module.exports = router;