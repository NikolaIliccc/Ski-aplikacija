const router = require("express").Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const logSecurityEvent = require("../utils/logSecurityEvent");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = await pool.query(
      `INSERT INTO users
   (
     name,
     email,
     password,
     role,
     is_verified,
     verification_token
   )
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING id, name, email, role`,
      [
        name,
        email,
        hashedPassword,
        role || "client",
        false,
        verificationToken
      ]
    );

    await logSecurityEvent({
      user_id: newUser.rows[0].id,
      email: newUser.rows[0].email,
      action: "REGISTER",
      status: "SUCCESS",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: "Korisnik je uspešno registrovan."
    });

    res.json({
      message: "Registracija uspešna",
      user: newUser.rows[0]
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
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
        users.is_verified,
        instructors.image_url
      FROM users
      LEFT JOIN instructors
      ON users.id = instructors.user_id
      WHERE users.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      await logSecurityEvent({
        email,
        action: "LOGIN_FAILED",
        status: "FAILED",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        details: "Pogrešan email."
      });

      return res.status(401).json({
        message: "Pogrešan email"
      });
    }

    const user = userResult.rows[0];

    if (
      user.locked_until &&
      new Date(user.locked_until) > new Date()
    ) {
      return res.status(403).json({
        message:
          "Nalog je privremeno zaključan. Pokušajte ponovo kasnije."
      });
    }

    if (user.is_verified === false) {
      return res.status(403).json({
        message: "Morate prvo verifikovati email adresu."
      });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logSecurityEvent({
        user_id: user.id,
        email: user.email,
        action: "LOGIN_BLOCKED",
        status: "FAILED",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        details: "Nalog je trenutno zaključan."
      });

      return res.status(403).json({
        message: "Nalog je privremeno zaključan. Pokušajte kasnije."
      });
    }
    if (!user.password) {
      await logSecurityEvent({
        user_id: user.id,
        email: user.email,
        action: "LOGIN_FAILED",
        status: "FAILED",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        details: "Pokušaj običnog logina za Google nalog."
      });

      return res.status(401).json({
        message: "Ovaj nalog koristi Google prijavu."
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const failedAttempts =
        Number(user.failed_login_attempts || 0) + 1;

      if (failedAttempts >= 5) {
        await pool.query(
          `UPDATE users
       SET failed_login_attempts = $1,
           locked_until = NOW() + interval '15 minutes'
       WHERE id = $2`,
          [failedAttempts, user.id]
        );

        await logSecurityEvent({
          user_id: user.id,
          email: user.email,
          action: "ACCOUNT_LOCKED",
          status: "FAILED",
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          details:
            "Nalog je zaključan zbog više neuspešnih pokušaja prijave."
        });

        return res.status(403).json({
          message:
            "Nalog je zaključan na 15 minuta zbog više neuspešnih pokušaja."
        });
      }

      await pool.query(
        `UPDATE users
     SET failed_login_attempts = $1
     WHERE id = $2`,
        [failedAttempts, user.id]
      );

      await logSecurityEvent({
        user_id: user.id,
        email: user.email,
        action: "LOGIN_FAILED",
        status: "FAILED",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        details: `Pogrešna šifra. Pokušaj ${failedAttempts}/5`
      });

      return res.status(401).json({
        message: "Pogrešna šifra"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await pool.query(
      `UPDATE users
   SET refresh_token = $1
   WHERE id = $2`,
      [refreshToken, user.id]
    );

    delete user.password;

    await pool.query(
      `UPDATE users
   SET failed_login_attempts = 0,
       locked_until = NULL
   WHERE id = $1`,
      [user.id]
    );

    await logSecurityEvent({
      user_id: user.id,
      email: user.email,
      action: "LOGIN_SUCCESS",
      status: "SUCCESS",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: "Korisnik se uspešno prijavio."
    });

    res.json({
      message: "Login uspešan",
      token,
      refreshToken,
      user
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
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
         (name, email, password, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role`,
        [name, email, null, "client", true]
      );

      user = {
        ...newUser.rows[0],
        image_url: picture || null
      };

      await logSecurityEvent({
        user_id: user.id,
        email: user.email,
        action: "GOOGLE_REGISTER",
        status: "SUCCESS",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        details: "Korisnik je registrovan preko Google naloga."
      });
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await pool.query(
      `UPDATE users
   SET refresh_token = $1
   WHERE id = $2`,
      [refreshToken, user.id]
    );

    await logSecurityEvent({
      user_id: user.id,
      email: user.email,
      action: "GOOGLE_LOGIN",
      status: "SUCCESS",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: "Korisnik se prijavio preko Google naloga."
    });

    res.json({
      message: "Google login uspešan",
      token,
      refreshToken,
      user
    });
  } catch (err) {
    console.log(err.message);

    await logSecurityEvent({
      action: "GOOGLE_LOGIN_FAILED",
      status: "FAILED",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: err.message
    });

    res.status(500).json({ error: err.message });
  }
});

// VERIFY EMAIL
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const userResult = await pool.query(
      `UPDATE users
       SET is_verified = true,
           verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, email`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "Verifikacioni token nije validan."
      });
    }

    const user = userResult.rows[0];

    await logSecurityEvent({
      user_id: user.id,
      email: user.email,
      action: "EMAIL_VERIFIED",
      status: "SUCCESS",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: "Email adresa je uspešno verifikovana."
    });

    res.json({
      message: "Email je uspešno verifikovan."
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const userResult = await pool.query(
      `SELECT id, role, refresh_token
       FROM users
       WHERE refresh_token = $1`,
      [refreshToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "Refresh token nije validan."
      });
    }

    const user = userResult.rows[0];

    jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    res.json({
      token: newAccessToken
    });
  } catch (err) {
    res.status(401).json({
      message: "Refresh token je istekao ili nije validan."
    });
  }
});

module.exports = router;