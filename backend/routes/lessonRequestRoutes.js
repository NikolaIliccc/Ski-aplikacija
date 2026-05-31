const router = require("express").Router();

const jwt = require("jsonwebtoken");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// OPTIONAL AUTH - ako korisnik ima token, povezi zahtev sa njim
const optionalAuth = (req, res, next) => {
  const token = req.header("token");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, "tajna123");
    req.user = verified;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const isInstructorBusy = async (instructorId, lessonDate, startTime, endTime) => {
  const busyResult = await pool.query(
    `SELECT *
     FROM lessons
     WHERE instructor_id = $1
     AND lesson_date = $2
     AND status = 'scheduled'
     AND (
       start_time < $4
       AND end_time > $3
     )`,
    [instructorId, lessonDate, startTime, endTime]
  );

  return busyResult.rows.length > 0;
};

// CREATE BOOKING REQUEST - javna forma ili ulogovan client
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      client_first_name,
      client_last_name,
      client_age,
      client_phone,
      client_skill_level,
      first_time,
      parent_name,
      parent_phone,
      lesson_type,
      lesson_mode,
      number_of_lessons,
      group_package,
      preferred_date,
      preferred_time,
      note
    } = req.body;

    if (
      !client_first_name ||
      !client_last_name ||
      !client_age ||
      !client_phone ||
      !client_skill_level ||
      !lesson_type ||
      !lesson_mode ||
      !preferred_date
    ) {
      return res.status(400).json({
        message: "Popunite sva obavezna polja."
      });
    }

    if (Number(client_age) < 18 && !parent_name) {
      return res.status(400).json({
        message: "Za maloletne polaznike morate uneti ime roditelja/staratelja."
      });
    }

    if (first_time === true && lesson_mode === "group") {
      return res.status(400).json({
        message:
          "Polaznici koji prvi put skijaju ili snowboarduju mogu zakazati samo individualni čas."
      });
    }

    if (lesson_mode === "individual" && !preferred_time) {
      return res.status(400).json({
        message: "Za individualni čas morate izabrati željeno vreme."
      });
    }

    let finalNumberOfLessons = Number(number_of_lessons);
    let finalPreferredTime = preferred_time;

    if (lesson_mode === "group") {
      finalPreferredTime = "10:00";

      if (group_package === "2h") {
        finalNumberOfLessons = 2;
      } else if (group_package === "4h_no_lunch") {
        finalNumberOfLessons = 4;
      } else if (group_package === "4h_lunch") {
        finalNumberOfLessons = 4;
      } else {
        return res.status(400).json({
          message: "Izaberite validan paket grupne nastave."
        });
      }
    }

    const userId = req.user ? req.user.id : null;

    const newRequest = await pool.query(
      `INSERT INTO lesson_requests
      (
        user_id,
        client_first_name,
        client_last_name,
        client_age,
        client_phone,
        client_skill_level,
        first_time,
        parent_name,
        parent_phone,
        lesson_type,
        lesson_mode,
        number_of_lessons,
        group_package,
        preferred_date,
        preferred_time,
        duration_minutes,
        note,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        userId,
        client_first_name,
        client_last_name,
        Number(client_age),
        client_phone,
        client_skill_level,
        first_time === true,
        parent_name || null,
        Number(client_age) < 18 ? client_phone : parent_phone || null,
        lesson_type,
        lesson_mode,
        finalNumberOfLessons,
        lesson_mode === "group" ? group_package : null,
        preferred_date,
        finalPreferredTime,
        60,
        note || null,
        "pending"
      ]
    );

    res.json({
      message: "Zahtev uspešno poslat",
      request: newRequest.rows[0]
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET MY REQUESTS - client vidi svoje zahteve
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const requests = await pool.query(
        `SELECT *
         FROM lesson_requests
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json(requests.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET ALL REQUESTS - samo admin/booker
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const requests = await pool.query(
        `SELECT *
         FROM lesson_requests
         ORDER BY created_at DESC`
      );

      res.json(requests.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// APPROVE REQUEST - samo admin/booker
router.post(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const requestId = req.params.id;

      const { instructor_id, lesson_date, start_time } = req.body;

      if (!instructor_id || !lesson_date) {
        return res.status(400).json({
          message: "Morate izabrati instruktora i datum časa."
        });
      }

      const requestResult = await pool.query(
        "SELECT * FROM lesson_requests WHERE id = $1",
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        return res.status(404).json({
          message: "Zahtev nije pronađen"
        });
      }

      const request = requestResult.rows[0];

      if (request.status !== "pending") {
        return res.status(400).json({
          message: "Ovaj zahtev je već obrađen."
        });
      }

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE id = $1",
        [instructor_id]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const instructor = instructorResult.rows[0];

      if (request.lesson_type === "ski" && instructor.ski_license === false) {
        return res.status(400).json({
          message: "Ovaj instruktor nema licencu za ski."
        });
      }

      if (
        request.lesson_type === "snowboard" &&
        instructor.snowboard_license === false
      ) {
        return res.status(400).json({
          message: "Ovaj instruktor nema licencu za snowboard."
        });
      }

      const createdLessons = [];

      if (request.lesson_mode === "group") {
        if (request.group_package === "2h") {
          const busy = await isInstructorBusy(
            instructor_id,
            lesson_date,
            "10:00",
            "12:00"
          );

          if (busy) {
            return res.status(400).json({
              message: "Instruktor je zauzet u terminu 10:00–12:00."
            });
          }

          const lesson = await pool.query(
            `INSERT INTO lessons
            (
              request_id,
              instructor_id,
              lesson_type,
              lesson_date,
              start_time,
              end_time,
              status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
              request.id,
              instructor_id,
              request.lesson_type,
              lesson_date,
              "10:00",
              "12:00",
              "scheduled"
            ]
          );

          createdLessons.push(lesson.rows[0]);
        }

        if (request.group_package === "4h_no_lunch") {
          const busy = await isInstructorBusy(
            instructor_id,
            lesson_date,
            "10:00",
            "14:00"
          );

          if (busy) {
            return res.status(400).json({
              message: "Instruktor je zauzet u terminu 10:00–14:00."
            });
          }

          const lesson = await pool.query(
            `INSERT INTO lessons
            (
              request_id,
              instructor_id,
              lesson_type,
              lesson_date,
              start_time,
              end_time,
              status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
              request.id,
              instructor_id,
              request.lesson_type,
              lesson_date,
              "10:00",
              "14:00",
              "scheduled"
            ]
          );

          createdLessons.push(lesson.rows[0]);
        }

        if (request.group_package === "4h_lunch") {
          const busyMorning = await isInstructorBusy(
            instructor_id,
            lesson_date,
            "10:00",
            "12:00"
          );

          const busyAfternoon = await isInstructorBusy(
            instructor_id,
            lesson_date,
            "14:00",
            "16:00"
          );

          if (busyMorning || busyAfternoon) {
            return res.status(400).json({
              message: "Instruktor je zauzet u jednom od termina grupne nastave."
            });
          }

          const firstLesson = await pool.query(
            `INSERT INTO lessons
            (
              request_id,
              instructor_id,
              lesson_type,
              lesson_date,
              start_time,
              end_time,
              status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
              request.id,
              instructor_id,
              request.lesson_type,
              lesson_date,
              "10:00",
              "12:00",
              "scheduled"
            ]
          );

          const secondLesson = await pool.query(
            `INSERT INTO lessons
            (
              request_id,
              instructor_id,
              lesson_type,
              lesson_date,
              start_time,
              end_time,
              status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
              request.id,
              instructor_id,
              request.lesson_type,
              lesson_date,
              "14:00",
              "16:00",
              "scheduled"
            ]
          );

          createdLessons.push(firstLesson.rows[0], secondLesson.rows[0]);
        }
      } else {
        const finalStartTime = start_time || request.preferred_time;

        if (!finalStartTime) {
          return res.status(400).json({
            message: "Morate izabrati vreme za individualni čas."
          });
        }

        const minutes = Number(request.number_of_lessons) * 60;

        const endTimeResult = await pool.query(
          "SELECT ($1::time + ($2 || ' minutes')::interval)::time AS end_time",
          [finalStartTime, minutes]
        );

        const endTime = endTimeResult.rows[0].end_time;

        const busy = await isInstructorBusy(
          instructor_id,
          lesson_date,
          finalStartTime,
          endTime
        );

        if (busy) {
          return res.status(400).json({
            message: `Instruktor je zauzet u terminu ${finalStartTime}–${endTime}.`
          });
        }

        const lesson = await pool.query(
          `INSERT INTO lessons
          (
            request_id,
            instructor_id,
            lesson_type,
            lesson_date,
            start_time,
            end_time,
            status
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING *`,
          [
            request.id,
            instructor_id,
            request.lesson_type,
            lesson_date,
            finalStartTime,
            endTime,
            "scheduled"
          ]
        );

        createdLessons.push(lesson.rows[0]);
      }

      await pool.query(
        "UPDATE lesson_requests SET status = $1 WHERE id = $2",
        ["approved", requestId]
      );

      res.json({
        message: "Zahtev je odobren i časovi su zakazani.",
        lessons: createdLessons
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// REJECT REQUEST - samo admin/booker
router.post(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const requestId = req.params.id;

      const rejectedRequest = await pool.query(
        `UPDATE lesson_requests
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        ["rejected", requestId]
      );

      res.json({
        message: "Zahtev je odbijen.",
        request: rejectedRequest.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// CANCEL REQUEST
router.post("/:id/cancel", async (req, res) => {
  try {
    const requestId = req.params.id;
    const { cancel_reason } = req.body;

    const cancelledRequest = await pool.query(
      `UPDATE lesson_requests
       SET status = $1, cancel_reason = $2
       WHERE id = $3
       RETURNING *`,
      ["cancelled", cancel_reason || null, requestId]
    );

    res.json({
      message: "Zahtev je otkazan.",
      request: cancelledRequest.rows[0]
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;