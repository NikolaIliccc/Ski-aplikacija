const router = require("express").Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const rateLimit = require("express-rate-limit");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// LOGIN RATE LIMIT
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    message: "Previše pokušaja prijave. Pokušajte ponovo za 15 minuta."
  }
});


// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Ime, email i lozinka su obavezni."
      });
    }

    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "Korisnik već postoji."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
       VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        "client",
        0,
        null,
        true
      ]
    );

    res.json({
      message: "Registracija uspešna.",
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
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.password,
         users.role,
         users.failed_login_attempts,
         users.locked_until,
         users.is_active,
         instructors.image_url
       FROM users
       LEFT JOIN instructors
         ON users.id = instructors.user_id
       WHERE users.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "Pogrešan email."
      });
    }

    const user = userResult.rows[0];


    // PROVERA DA LI JE NALOG AKTIVAN
    if (user.is_active === false) {
      return res.status(403).json({
        message: "Ovaj korisnički nalog je deaktiviran."
      });
    }


    // PROVERA DA LI JE NALOG PRIVREMENO ZAKLJUČAN
    if (
      user.locked_until &&
      new Date(user.locked_until) > new Date()
    ) {
      return res.status(403).json({
        message:
          "Nalog je privremeno zaključan. Pokušajte ponovo kasnije."
      });
    }


    // GOOGLE NALOG BEZ LOZINKE
    if (!user.password) {
      return res.status(401).json({
        message: "Ovaj nalog koristi Google prijavu."
      });
    }


    // PROVERA LOZINKE
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      const failedAttempts =
        Number(user.failed_login_attempts || 0) + 1;

      if (failedAttempts >= 5) {
        await pool.query(
          `UPDATE users
           SET failed_login_attempts = $1,
               locked_until = NOW() + interval '15 minutes'
           WHERE id = $2`,
          [
            failedAttempts,
            user.id
          ]
        );

        return res.status(403).json({
          message:
            "Nalog je zaključan na 15 minuta zbog više neuspešnih pokušaja."
        });
      }

      await pool.query(
        `UPDATE users
         SET failed_login_attempts = $1
         WHERE id = $2`,
        [
          failedAttempts,
          user.id
        ]
      );

      return res.status(401).json({
        message: "Pogrešna šifra."
      });
    }


    // USPEŠAN LOGIN
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           locked_until = NULL
       WHERE id = $1`,
      [user.id]
    );


    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET
    );


    delete user.password;
    delete user.failed_login_attempts;
    delete user.locked_until;


    res.json({
      message: "Login uspešan.",
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


// GOOGLE LOGIN / REGISTER
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential nije poslat."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let userResult = await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.role,
         users.is_active,
         instructors.image_url
       FROM users
       LEFT JOIN instructors
         ON users.id = instructors.user_id
       WHERE users.email = $1`,
      [email]
    );

    let user;

    if (userResult.rows.length === 0) {
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
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING
           id,
           name,
           email,
           role,
           is_active`,
        [
          name,
          email,
          null,
          "client",
          0,
          null,
          true
        ]
      );

      user = {
        ...newUser.rows[0],
        image_url: picture || null
      };

    } else {
      user = userResult.rows[0];
    }

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Ovaj korisnički nalog je deaktiviran."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET
    );

    res.json({
      message: "Google login uspešan.",
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


// VERIFY JWT TOKEN
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.role,
         users.is_active,
         instructors.image_url
       FROM users
       LEFT JOIN instructors
         ON users.id = instructors.user_id
       WHERE users.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Korisnik nije pronađen."
      });
    }

    const user = userResult.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Ovaj korisnički nalog je deaktiviran."
      });
    }

    res.json({
      message: "Token validan.",
      user
    });

  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});


module.exports = router;