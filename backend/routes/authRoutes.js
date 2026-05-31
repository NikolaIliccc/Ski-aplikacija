const router = require("express").Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db/db");

const authMiddleware = require("../middleware/authMiddleware");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "Korisnik već postoji"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users
       (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    res.json({
      message: "Registracija uspešna",
      user: newUser.rows[0]
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      `SELECT
        users.id,
        users.name,
        users.email,
        users.password,
        users.role,
        instructors.image_url
      FROM users
      LEFT JOIN instructors
      ON users.id = instructors.user_id
      WHERE users.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "Pogrešan email"
      });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Pogrešna šifra"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      "tajna123"
    );

    delete user.password;

    res.json({
      message: "Login uspešan",
      token,
      user
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

// VERIFY TOKEN
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT
        users.id,
        users.name,
        users.email,
        users.role,
        instructors.image_url
      FROM users
      LEFT JOIN instructors
      ON users.id = instructors.user_id
      WHERE users.id = $1`,
      [req.user.id]
    );

    res.json({
      message: "Token validan",
      user: userResult.rows[0]
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;