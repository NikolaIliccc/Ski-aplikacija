const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// GET ALL USERS - samo admin
// =====================================================

router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const users = await pool.query(
        `SELECT
           id,
           name,
           email,
           role,
           is_active
         FROM users
         ORDER BY id ASC`
      );

      res.json(users.rows);
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// ADD USER - samo admin
// =====================================================

router.post(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message:
            "Ime, email, lozinka i uloga su obavezni."
        });
      }

      const allowedRoles = [
        "client",
        "instructor",
        "booker",
        "admin"
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Neispravna korisnička uloga."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Lozinka mora imati najmanje 6 karaktera."
        });
      }

      const existingUser = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1`,
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          message:
            "Korisnik sa ovim emailom već postoji."
        });
      }

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      const newUser = await pool.query(
        `INSERT INTO users
         (
           name,
           email,
           password,
           role,
           failed_login_attempts,
           locked_until,
           is_active
         )
         VALUES ($1, $2, $3, $4, 0, NULL, TRUE)
         RETURNING
           id,
           name,
           email,
           role,
           is_active`,
        [
          name,
          email,
          hashedPassword,
          role
        ]
      );

      res.status(201).json({
        message: "Korisnik je uspešno dodat.",
        user: newUser.rows[0]
      });
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// UPDATE USER - samo admin
// =====================================================

router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const {
        name,
        email,
        role
      } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({
          message:
            "Ime, email i uloga su obavezni."
        });
      }

      const allowedRoles = [
        "client",
        "instructor",
        "booker",
        "admin"
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Neispravna korisnička uloga."
        });
      }

      const userResult = await pool.query(
        `SELECT id
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "Korisnik nije pronađen."
        });
      }

      const emailResult = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1
           AND id != $2`,
        [
          email,
          userId
        ]
      );

      if (emailResult.rows.length > 0) {
        return res.status(400).json({
          message:
            "Drugi korisnik već koristi ovaj email."
        });
      }

      const updatedUser = await pool.query(
        `UPDATE users
         SET name = $1,
             email = $2,
             role = $3
         WHERE id = $4
         RETURNING
           id,
           name,
           email,
           role,
           is_active`,
        [
          name,
          email,
          role,
          userId
        ]
      );

      res.json({
        message: "Korisnik je uspešno izmenjen.",
        user: updatedUser.rows[0]
      });
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// ACTIVATE / DEACTIVATE USER - samo admin
// =====================================================

router.patch(
  "/users/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        return res.status(400).json({
          message: "Status nije validan."
        });
      }

      if (userId === Number(req.user.id)) {
        return res.status(400).json({
          message:
            "Ne možete aktivirati/deaktivirati sopstveni administratorski nalog."
        });
      }

      const updatedUser = await pool.query(
        `UPDATE users
         SET is_active = $1
         WHERE id = $2
         RETURNING
           id,
           name,
           email,
           role,
           is_active`,
        [
          is_active,
          userId
        ]
      );

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({
          message: "Korisnik nije pronađen."
        });
      }

      res.json({
        message: is_active
          ? "Korisnik je aktiviran."
          : "Korisnik je deaktiviran.",

        user: updatedUser.rows[0]
      });
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// RESET PASSWORD - samo admin
// =====================================================

router.patch(
  "/users/:id/password",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({
          message:
            "Lozinka mora imati najmanje 6 karaktera."
        });
      }

      const userResult = await pool.query(
        `SELECT id
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "Korisnik nije pronađen."
        });
      }

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      await pool.query(
        `UPDATE users
         SET password = $1,
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $2`,
        [
          hashedPassword,
          userId
        ]
      );

      res.json({
        message:
          "Lozinka je uspešno promenjena."
      });
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// DELETE USER - samo admin
// =====================================================

router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      if (userId === Number(req.user.id)) {
        return res.status(400).json({
          message:
            "Ne možete obrisati sopstveni administratorski nalog."
        });
      }

      const userResult = await pool.query(
        `SELECT
           id,
           role
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "Korisnik nije pronađen."
        });
      }

      if (
        userResult.rows[0].role === "instructor"
      ) {
        return res.status(400).json({
          message:
            "Instruktora obrišite preko sekcije Instruktori."
        });
      }

      await pool.query(
        `DELETE FROM users
         WHERE id = $1`,
        [userId]
      );

      res.json({
        message:
          "Korisnik je uspešno obrisan."
      });
    } catch (err) {
      console.log(err.message);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


module.exports = router;