const router = require("express").Router();

const bcrypt = require("bcrypt");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// =====================================================
// GET PUBLIC INSTRUCTORS
// Javno za homepage
// =====================================================

router.get(
  "/public",
  async (req, res) => {
    try {
      const instructors =
        await pool.query(
          `
          SELECT
            instructors.id,
            instructors.user_id,
            instructors.ski_license,
            instructors.snowboard_license,
            instructors.experience_level,
            instructors.image_url,

            users.name

          FROM instructors

          JOIN users
            ON instructors.user_id = users.id

          WHERE users.is_active = true

          ORDER BY users.name ASC
          `
        );


      res.json(
        instructors.rows
      );

    } catch (err) {
      console.log(
        err.message
      );

      res.status(500).json({
        error:
          err.message
      });
    }
  }
);


// =====================================================
// ADD INSTRUCTOR
// Admin / Booker
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "admin",
    "booker"
  ),
  async (req, res) => {
    try {
      const {
        user_id,
        ski_license,
        snowboard_license,
        experience_level,
        image_url
      } = req.body;


      if (!user_id) {
        return res.status(400).json({
          message:
            "Morate izabrati korisnički nalog."
        });
      }


      const userResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            is_active
          FROM users
          WHERE id = $1
          `,
          [
            user_id
          ]
        );


      if (
        userResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Korisnički nalog nije pronađen."
        });
      }


      const existingInstructor =
        await pool.query(
          `
          SELECT id
          FROM instructors
          WHERE user_id = $1
          `,
          [
            user_id
          ]
        );


      if (
        existingInstructor.rows.length > 0
      ) {
        return res.status(400).json({
          message:
            "Ovaj korisnik je već registrovan kao instruktor."
        });
      }


      const newInstructor =
        await pool.query(
          `
          INSERT INTO instructors
          (
            user_id,
            ski_license,
            snowboard_license,
            experience_level,
            image_url
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING *
          `,
          [
            user_id,
            ski_license,
            snowboard_license,
            experience_level,
            image_url || null
          ]
        );


      res.json({
        message:
          "Instruktor je dodat.",

        instructor:
          newInstructor.rows[0]
      });

    } catch (err) {
      console.log(
        err.message
      );

      res.status(500).json({
        error:
          err.message
      });
    }
  }
);


// =====================================================
// GET ALL INSTRUCTORS
// Admin / Booker
// =====================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware(
    "admin",
    "booker"
  ),
  async (req, res) => {
    try {
      const instructors =
        await pool.query(
          `
          SELECT
            instructors.id,
            instructors.user_id,
            instructors.ski_license,
            instructors.snowboard_license,
            instructors.experience_level,
            instructors.image_url,

            users.name,
            users.email,
            users.is_active,
            users.role

          FROM instructors

          JOIN users
            ON instructors.user_id = users.id

          ORDER BY users.name ASC
          `
        );


      res.json(
        instructors.rows
      );

    } catch (err) {
      console.log(
        err.message
      );

      res.status(500).json({
        error:
          err.message
      });
    }
  }
);


// =====================================================
// DELETE INSTRUCTOR
// SAMO ADMINISTRATOR
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );


      const instructorId =
        req.params.id;

      const {
        password
      } = req.body;


      // =====================================================
      // LOZINKA ADMINISTRATORA
      // =====================================================

      if (!password) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Morate uneti svoju lozinku."
        });
      }


      const adminUser =
        await client.query(
          `
          SELECT
            id,
            password,
            role
          FROM users
          WHERE id = $1
          `,
          [
            req.user.id
          ]
        );


      if (
        adminUser.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          message:
            "Korisnik nije pronađen."
        });
      }


      if (
        adminUser.rows[0].role !==
        "admin"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({
          message:
            "Samo administrator može obrisati instruktora."
        });
      }


      if (
        !adminUser.rows[0].password
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Administratorski nalog nema postavljenu lozinku."
        });
      }


      const validPassword =
        await bcrypt.compare(
          password,
          adminUser.rows[0].password
        );


      if (!validPassword) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(401).json({
          message:
            "Pogrešna lozinka."
        });
      }


      // =====================================================
      // PROVERA INSTRUKTORA
      // =====================================================

      const instructorResult =
        await client.query(
          `
          SELECT
            instructors.*,
            users.name,
            users.email
          FROM instructors
          JOIN users
            ON instructors.user_id = users.id
          WHERE instructors.id = $1
          `,
          [
            instructorId
          ]
        );


      if (
        instructorResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          message:
            "Instruktor nije pronađen."
        });
      }


      const instructor =
        instructorResult.rows[0];


      // =====================================================
      // PROVERA ČASOVA
      // =====================================================

      const lessons =
        await client.query(
          `
          SELECT id
          FROM lessons
          WHERE instructor_id = $1
          `,
          [
            instructorId
          ]
        );


      if (
        lessons.rows.length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Ne možete obrisati instruktora koji ima evidentirane časove."
        });
      }


      // =====================================================
      // BRISANJE INSTRUKTORA
      // =====================================================

      const deletedInstructor =
        await client.query(
          `
          DELETE FROM instructors
          WHERE id = $1
          RETURNING *
          `,
          [
            instructorId
          ]
        );


      // =====================================================
      // BRISANJE POVEZANOG USER NALOGA
      // =====================================================

      await client.query(
        `
        DELETE FROM users
        WHERE id = $1
        `,
        [
          instructor.user_id
        ]
      );


      await client.query(
        "COMMIT"
      );


      res.json({
        message:
          "Instruktor i povezani korisnički nalog su obrisani.",

        instructor:
          deletedInstructor.rows[0]
      });

    } catch (err) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.log(
          "ROLLBACK ERROR:",
          rollbackError.message
        );
      }


      console.log(
        err.message
      );


      res.status(500).json({
        error:
          err.message
      });

    } finally {
      client.release();
    }
  }
);


// =====================================================
// UPDATE INSTRUCTOR
// Admin / Booker
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "admin",
    "booker"
  ),
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );


      const instructorId =
        req.params.id;


      const {
        name,
        email,
        ski_license,
        snowboard_license,
        experience_level,
        image_url,
        is_active
      } = req.body;


      // =====================================================
      // PROVERA INSTRUKTORA
      // =====================================================

      const instructorResult =
        await client.query(
          `
          SELECT *
          FROM instructors
          WHERE id = $1
          `,
          [
            instructorId
          ]
        );


      if (
        instructorResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          message:
            "Instruktor nije pronađen."
        });
      }


      if (
        !name ||
        !email
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Ime i email su obavezni."
        });
      }


      const userId =
        instructorResult.rows[0]
          .user_id;


      // =====================================================
      // PROVERA EMAIL-A
      // =====================================================

      const emailExists =
        await client.query(
          `
          SELECT id
          FROM users
          WHERE email = $1
            AND id != $2
          `,
          [
            email,
            userId
          ]
        );


      if (
        emailExists.rows.length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Korisnik sa ovom email adresom već postoji."
        });
      }


      // =====================================================
      // UPDATE USER PODATAKA
      // =====================================================

      let updatedUser;


      if (
        typeof is_active ===
        "boolean"
      ) {
        updatedUser =
          await client.query(
            `
            UPDATE users
            SET
              name = $1,
              email = $2,
              is_active = $3
            WHERE id = $4
            RETURNING
              id,
              name,
              email,
              role,
              is_active
            `,
            [
              name,
              email,
              is_active,
              userId
            ]
          );

      } else {
        updatedUser =
          await client.query(
            `
            UPDATE users
            SET
              name = $1,
              email = $2
            WHERE id = $3
            RETURNING
              id,
              name,
              email,
              role,
              is_active
            `,
            [
              name,
              email,
              userId
            ]
          );
      }


      // =====================================================
      // UPDATE INSTRUCTOR PODATAKA
      // =====================================================

      const updatedInstructor =
        await client.query(
          `
          UPDATE instructors
          SET
            ski_license = $1,
            snowboard_license = $2,
            experience_level = $3,
            image_url = $4
          WHERE id = $5
          RETURNING *
          `,
          [
            ski_license,
            snowboard_license,
            experience_level,
            image_url || null,
            instructorId
          ]
        );


      await client.query(
        "COMMIT"
      );


      res.json({
        message:
          "Instruktor je uspešno izmenjen.",

        instructor: {
          ...updatedInstructor.rows[0],

          name:
            updatedUser.rows[0].name,

          email:
            updatedUser.rows[0].email,

          role:
            updatedUser.rows[0].role,

          is_active:
            updatedUser.rows[0].is_active
        }
      });

    } catch (err) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.log(
          "ROLLBACK ERROR:",
          rollbackError.message
        );
      }


      console.log(
        err.message
      );


      res.status(500).json({
        error:
          err.message
      });

    } finally {
      client.release();
    }
  }
);


module.exports = router;