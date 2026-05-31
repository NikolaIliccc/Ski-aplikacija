const router = require("express").Router();

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// CLIENT - šalje zahtev za promenu časa
router.post(
    "/",
    authMiddleware,
    roleMiddleware("client"),
    async (req, res) => {
        try {
            const { lesson_id, requested_date, requested_time, reason } = req.body;

            if (!lesson_id || !requested_date || !requested_time || !reason) {
                return res.status(400).json({
                    message: "Popunite sve podatke za zahtev za promenu."
                });
            }

            const lessonResult = await pool.query(
                `SELECT lessons.*
         FROM lessons
         JOIN lesson_requests
         ON lessons.request_id = lesson_requests.id
         WHERE lessons.id = $1
         AND lesson_requests.user_id = $2`,
                [lesson_id, req.user.id]
            );

            if (lessonResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Čas nije pronađen ili ne pripada ovom korisniku."
                });
            }

            const newRequest = await pool.query(
                `INSERT INTO lesson_change_requests
        (
          lesson_id,
          user_id,
          requested_date,
          requested_time,
          reason,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
                [
                    lesson_id,
                    req.user.id,
                    requested_date,
                    requested_time,
                    reason,
                    "pending"
                ]
            );

            res.json({
                message: "Zahtev za promenu je poslat.",
                change_request: newRequest.rows[0]
            });
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        }
    }
);

// CLIENT - vidi svoje zahteve za promenu
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("client"),
    async (req, res) => {
        try {
            const requests = await pool.query(
                `SELECT
          lesson_change_requests.*,
          lessons.lesson_date,
          lessons.start_time,
          lessons.end_time,
          lessons.lesson_type
        FROM lesson_change_requests
        JOIN lessons
        ON lesson_change_requests.lesson_id = lessons.id
        WHERE lesson_change_requests.user_id = $1
        ORDER BY lesson_change_requests.created_at DESC`,
                [req.user.id]
            );

            res.json(requests.rows);
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        }
    }
);

// ADMIN/BOOKER - vidi sve zahteve za promenu
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "booker"),
    async (req, res) => {
        try {
            const requests = await pool.query(
                `SELECT
          lesson_change_requests.*,

          lessons.lesson_date,
          lessons.start_time,
          lessons.end_time,
          lessons.lesson_type,
          lessons.instructor_id,

          lesson_requests.client_first_name,
          lesson_requests.client_last_name,
          lesson_requests.client_phone,

          users.name AS client_name,
          users.email AS client_email

        FROM lesson_change_requests

        JOIN lessons
        ON lesson_change_requests.lesson_id = lessons.id

        JOIN lesson_requests
        ON lessons.request_id = lesson_requests.id

        JOIN users
        ON lesson_change_requests.user_id = users.id

        ORDER BY lesson_change_requests.created_at DESC`
            );

            res.json(requests.rows);
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        }
    }
);

// ADMIN/BOOKER - odbija zahtev
router.post(
    "/:id/reject",
    authMiddleware,
    roleMiddleware("admin", "booker"),
    async (req, res) => {
        try {
            const { booker_response } = req.body;

            const updated = await pool.query(
                `UPDATE lesson_change_requests
         SET status = $1,
             booker_response = $2
         WHERE id = $3
         RETURNING *`,
                ["rejected", booker_response || null, req.params.id]
            );

            res.json({
                message: "Zahtev za promenu je odbijen.",
                change_request: updated.rows[0]
            });
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        }
    }
);
// ADMIN/BOOKER - odobrava zahtev za promenu termina
router.post(
    "/:id/approve",
    authMiddleware,
    roleMiddleware("admin", "booker"),
    async (req, res) => {
        try {
            const { booker_response } = req.body;
            const changeRequestId = req.params.id;

            const changeRequestResult = await pool.query(
                `SELECT *
         FROM lesson_change_requests
         WHERE id = $1`,
                [changeRequestId]
            );

            if (changeRequestResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Zahtev za promenu nije pronađen."
                });
            }

            const changeRequest = changeRequestResult.rows[0];

            if (changeRequest.status !== "pending") {
                return res.status(400).json({
                    message: "Ovaj zahtev je već obrađen."
                });
            }

            const lessonResult = await pool.query(
                `SELECT *
         FROM lessons
         WHERE id = $1`,
                [changeRequest.lesson_id]
            );

            if (lessonResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Čas nije pronađen."
                });
            }

            const lesson = lessonResult.rows[0];

            const endTimeResult = await pool.query(
                `SELECT ($1::time + (EXTRACT(EPOCH FROM ($2::time - $3::time)) || ' seconds')::interval)::time AS end_time`,
                [
                    changeRequest.requested_time,
                    lesson.end_time,
                    lesson.start_time
                ]
            );

            const newEndTime = endTimeResult.rows[0].end_time;

            const busyResult = await pool.query(
                `SELECT *
         FROM lessons
         WHERE instructor_id = $1
         AND lesson_date::date = $2::date
         AND id != $3
         AND status = 'scheduled'
         AND (
           start_time < $5::time
           AND end_time > $4::time
         )`,
                [
                    lesson.instructor_id,
                    changeRequest.requested_date,
                    lesson.id,
                    changeRequest.requested_time,
                    newEndTime
                ]
            );

            if (busyResult.rows.length > 0) {
                return res.status(400).json({
                    message: "Instruktor je zauzet u traženom terminu."
                });
            }

            const busyBlockResult = await pool.query(
                `SELECT *
         FROM instructor_unavailability
         WHERE instructor_id = $1
         AND unavailable_date::date = $2::date
         AND (
           start_time < $4::time
           AND end_time > $3::time
         )`,
                [
                    lesson.instructor_id,
                    changeRequest.requested_date,
                    changeRequest.requested_time,
                    newEndTime
                ]
            );

            if (busyBlockResult.rows.length > 0) {
                return res.status(400).json({
                    message: "Instruktor je označio da nije dostupan u traženom terminu."
                });
            }

            await pool.query(
                `UPDATE lessons
         SET lesson_date = $1,
             start_time = $2,
             end_time = $3
         WHERE id = $4`,
                [
                    changeRequest.requested_date,
                    changeRequest.requested_time,
                    newEndTime,
                    lesson.id
                ]
            );

            const updatedChangeRequest = await pool.query(
                `UPDATE lesson_change_requests
         SET status = $1,
             booker_response = $2
         WHERE id = $3
         RETURNING *`,
                [
                    "approved",
                    booker_response || "Promena termina je odobrena.",
                    changeRequestId
                ]
            );

            res.json({
                message: "Promena termina je odobrena.",
                change_request: updatedChangeRequest.rows[0]
            });
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        }
    }
);
module.exports = router;