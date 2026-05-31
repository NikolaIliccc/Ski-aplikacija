const router = require("express").Router();

const bcrypt = require("bcrypt");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET PUBLIC INSTRUCTORS - javno za homepage
router.get("/public", async (req, res) => {
  try {
    const instructors = await pool.query(
      `SELECT
  instructors.id,
  instructors.ski_license,
  instructors.snowboard_license,
  instructors.experience_level,
  instructors.image_url,
  users.name
FROM instructors
JOIN users
ON instructors.user_id = users.id
ORDER BY users.name ASC`
    );

    res.json(instructors.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});


// ADD INSTRUCTOR - samo admin/booker
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const {
        user_id,
        ski_license,
        snowboard_license,
        experience_level,
        image_url
      } = req.body;

      const newInstructor = await pool.query(
        `INSERT INTO instructors
        (
          user_id,
          ski_license,
          snowboard_license,
          experience_level,
          image_url
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          user_id,
          ski_license,
          snowboard_license,
          experience_level,
          image_url
        ]
      );

      res.json({
        message: "Instruktor je dodat.",
        instructor: newInstructor.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET ALL INSTRUCTORS - samo admin/booker
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const instructors = await pool.query(
        `SELECT
  instructors.id,
  instructors.ski_license,
  instructors.snowboard_license,
  instructors.experience_level,
  instructors.image_url,
  users.name
FROM instructors
JOIN users
ON instructors.user_id = users.id
ORDER BY users.name ASC`
      );

      res.json(instructors.rows);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE INSTRUCTOR - samo admin/booker + password potvrda
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const instructorId = req.params.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          message: "Morate uneti svoju lozinku."
        });
      }

      const adminUser = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [req.user.id]
      );

      if (adminUser.rows.length === 0) {
        return res.status(404).json({
          message: "Korisnik nije pronađen."
        });
      }

      const validPassword = await bcrypt.compare(
        password,
        adminUser.rows[0].password
      );

      if (!validPassword) {
        return res.status(401).json({
          message: "Pogrešna lozinka."
        });
      }

      const lessons = await pool.query(
        "SELECT * FROM lessons WHERE instructor_id = $1",
        [instructorId]
      );

      if (lessons.rows.length > 0) {
        return res.status(400).json({
          message: "Ne možete obrisati instruktora koji ima zakazane časove."
        });
      }

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE id = $1",
        [instructorId]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const userId = instructorResult.rows[0].user_id;

      const deletedInstructor = await pool.query(
        "DELETE FROM instructors WHERE id = $1 RETURNING *",
        [instructorId]
      );

      await pool.query(
        "DELETE FROM users WHERE id = $1",
        [userId]
      );

      res.json({
        message: "Instruktor je obrisan.",
        instructor: deletedInstructor.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// UPDATE INSTRUCTOR - samo admin/booker
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  async (req, res) => {
    try {
      const instructorId = req.params.id;

      const {
        name,
        email,
        ski_license,
        snowboard_license,
        experience_level,
        image_url
      } = req.body;

      const instructorResult = await pool.query(
        "SELECT * FROM instructors WHERE id = $1",
        [instructorId]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          message: "Instruktor nije pronađen."
        });
      }

      const userId = instructorResult.rows[0].user_id;

      await pool.query(
        `UPDATE users
         SET name = $1,
             email = $2
         WHERE id = $3`,
        [name, email, userId]
      );

      const updatedInstructor = await pool.query(
        `UPDATE instructors
         SET ski_license = $1,
             snowboard_license = $2,
             experience_level = $3,
             image_url = $4
         WHERE id = $5
         RETURNING *`,
        [
          ski_license,
          snowboard_license,
          experience_level,
          image_url,
          instructorId
        ]
      );

      res.json({
        message: "Instruktor je uspešno izmenjen.",
        instructor: updatedInstructor.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);


module.exports = router;