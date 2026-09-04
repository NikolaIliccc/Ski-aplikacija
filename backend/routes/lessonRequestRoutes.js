const router = require("express").Router();

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  logActivity,
  getIpAddress
} = require("../utils/auditLogger");


// =====================================================
// PROVERA DA LI JE INSTRUKTOR ZAUZET
// =====================================================

const isInstructorBusy = async (
  instructorId,
  lessonDate,
  startTime,
  endTime
) => {
  const busyResult = await pool.query(
    `
    SELECT *
    FROM lessons
    WHERE instructor_id = $1
      AND lesson_date = $2
      AND status = 'scheduled'
      AND (
        start_time < $4
        AND end_time > $3
      )
    `,
    [
      instructorId,
      lessonDate,
      startTime,
      endTime
    ]
  );

  return busyResult.rows.length > 0;
};


// =====================================================
// CREATE BOOKING REQUEST
// SAMO ULOGOVAN KLIJENT
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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
        note,
        ai_procena_id
      } = req.body;


      // =====================================================
      // OSNOVNA VALIDACIJA
      // =====================================================

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
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Popunite sva obavezna polja."
        });
      }


      if (
        Number(client_age) < 18 &&
        !parent_name
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Za maloletne polaznike morate uneti ime roditelja/staratelja."
        });
      }


      if (
        first_time === true &&
        lesson_mode === "group"
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Polaznici koji prvi put skijaju ili snowboarduju mogu zakazati samo individualni čas."
        });
      }


      if (
        lesson_mode === "individual" &&
        !preferred_time
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Za individualni čas morate izabrati željeno vreme."
        });
      }


      // =====================================================
      // BROJ ČASOVA / VREME
      // =====================================================

      let finalNumberOfLessons =
        Number(number_of_lessons);

      let finalPreferredTime =
        preferred_time;


      if (lesson_mode === "group") {
        finalPreferredTime = "10:00";

        if (group_package === "2h") {
          finalNumberOfLessons = 2;

        } else if (
          group_package === "4h_no_lunch"
        ) {
          finalNumberOfLessons = 4;

        } else if (
          group_package === "4h_lunch"
        ) {
          finalNumberOfLessons = 4;

        } else {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "Izaberite validan paket grupne nastave."
          });
        }
      }


      const userId = req.user.id;


      // =====================================================
      // PROVERA AI PROCENE
      // =====================================================

      let aiAssessment = null;

      if (ai_procena_id) {
        const aiCheck = await client.query(
          `
          SELECT *
          FROM ai_procene
          WHERE id = $1
            AND korisnik_id = $2
          `,
          [
            ai_procena_id,
            userId
          ]
        );


        if (aiCheck.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "AI procena nije pronađena ili ne pripada prijavljenom korisniku."
          });
        }


        aiAssessment =
          aiCheck.rows[0];


        if (
          aiAssessment.zahtev_rezervacije_id
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "Ova AI procena je već povezana sa drugim zahtevom."
          });
        }
      }


      // =====================================================
      // KREIRANJE ZAHTEVA
      // =====================================================

      const newRequest =
        await client.query(
          `
          INSERT INTO lesson_requests
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
          VALUES
          (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12,$13,$14,$15,$16,$17,$18
          )
          RETURNING *
          `,
          [
            userId,
            client_first_name,
            client_last_name,
            Number(client_age),
            client_phone,
            client_skill_level,
            first_time === true,
            parent_name || null,

            Number(client_age) < 18
              ? client_phone
              : parent_phone || null,

            lesson_type,
            lesson_mode,
            finalNumberOfLessons,

            lesson_mode === "group"
              ? group_package
              : null,

            preferred_date,
            finalPreferredTime,
            60,
            note || null,
            "pending"
          ]
        );


      const createdRequest =
        newRequest.rows[0];


      // =====================================================
      // POVEZIVANJE AI PROCENE SA ZAHTEVOM
      // =====================================================

      let linkedAiAssessment = null;

      if (ai_procena_id) {
        const updatedAi =
          await client.query(
            `
            UPDATE ai_procene
            SET zahtev_rezervacije_id = $1
            WHERE id = $2
              AND korisnik_id = $3
              AND zahtev_rezervacije_id IS NULL
            RETURNING *
            `,
            [
              createdRequest.id,
              ai_procena_id,
              userId
            ]
          );


        if (updatedAi.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "AI procena nije mogla da se poveže sa zahtevom."
          });
        }


        linkedAiAssessment =
          updatedAi.rows[0];
      }


      await logActivity(
        {
          userId,

          action:
            "CREATE_LESSON_REQUEST",

          entityType:
            "lesson_request",

          entityId:
            createdRequest.id,

          details:
            `Poslat zahtev za ${lesson_type} čas. ` +
            `Tip nastave: ${lesson_mode}.`,

          ipAddress:
            getIpAddress(req)
        },
        client
      );


      await client.query("COMMIT");


      res.json({
        message:
          "Zahtev uspešno poslat.",

        request:
          createdRequest,

        ai_procena:
          linkedAiAssessment
      });


    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.log(
          "ROLLBACK ERROR:",
          rollbackError.message
        );
      }

      console.log(
        "CREATE LESSON REQUEST ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Došlo je do greške pri kreiranju zahteva.",

        error:
          err.message
      });

    } finally {
      client.release();
    }
  }
);


// =====================================================
// GET MY REQUESTS
// CLIENT
// =====================================================

router.get(
  "/my",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const requests =
        await pool.query(
          `
          SELECT
            lr.*,

            CASE
              WHEN ap.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', ap.id,
                'disciplina', ap.disciplina,
                'iskustvo', ap.iskustvo,
                'koristi_zicaru', ap.koristi_zicaru,
                'kontrolise_brzinu', ap.kontrolise_brzinu,
                'paralelni_zavoji', ap.paralelni_zavoji,
                'sigurnost_na_stazi', ap.sigurnost_na_stazi,
                'procenjeni_nivo', ap.procenjeni_nivo,
                'preporuceni_tip_casa', ap.preporuceni_tip_casa,
                'obrazlozenje', ap.obrazlozenje,
                'datum_procene', ap.datum_procene
              )
            END AS ai_procena

          FROM lesson_requests lr

          LEFT JOIN ai_procene ap
            ON ap.zahtev_rezervacije_id = lr.id

          WHERE lr.user_id = $1

          ORDER BY lr.created_at DESC
          `,
          [
            req.user.id
          ]
        );


      res.json(
        requests.rows
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
// GET ALL REQUESTS
// ADMIN / BOOKER
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
      const requests =
        await pool.query(
          `
          SELECT
            lr.*,

            CASE
              WHEN ap.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', ap.id,
                'disciplina', ap.disciplina,
                'iskustvo', ap.iskustvo,
                'koristi_zicaru', ap.koristi_zicaru,
                'kontrolise_brzzinu', ap.kontrolise_brzinu,
                'paralelni_zavoji', ap.paralelni_zavoji,
                'sigurnost_na_stazi', ap.sigurnost_na_stazi,
                'procenjeni_nivo', ap.procenjeni_nivo,
                'preporuceni_tip_casa', ap.preporuceni_tip_casa,
                'obrazlozenje', ap.obrazlozenje,
                'datum_procene', ap.datum_procene
              )
            END AS ai_procena

          FROM lesson_requests lr

          LEFT JOIN ai_procene ap
            ON ap.zahtev_rezervacije_id = lr.id

          ORDER BY lr.created_at DESC
          `
        );


      res.json(
        requests.rows
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
// APPROVE REQUEST
// ADMIN / BOOKER
// =====================================================

router.post(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(
    "admin",
    "booker"
  ),
  async (req, res) => {
    try {
      const requestId =
        req.params.id;

      const {
        instructor_id,
        lesson_date,
        start_time
      } = req.body;


      if (
        !instructor_id ||
        !lesson_date
      ) {
        return res.status(400).json({
          message:
            "Morate izabrati instruktora i datum časa."
        });
      }


      const requestResult =
        await pool.query(
          `
          SELECT *
          FROM lesson_requests
          WHERE id = $1
          `,
          [
            requestId
          ]
        );


      if (
        requestResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Zahtev nije pronađen."
        });
      }


      const request =
        requestResult.rows[0];


      if (
        request.status !== "pending"
      ) {
        return res.status(400).json({
          message:
            "Ovaj zahtev je već obrađen."
        });
      }


      const instructorResult =
        await pool.query(
          `
          SELECT *
          FROM instructors
          WHERE id = $1
          `,
          [
            instructor_id
          ]
        );


      if (
        instructorResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Instruktor nije pronađen."
        });
      }


      const instructor =
        instructorResult.rows[0];


      if (
        request.lesson_type === "ski" &&
        instructor.ski_license === false
      ) {
        return res.status(400).json({
          message:
            "Ovaj instruktor nema licencu za ski."
        });
      }


      if (
        request.lesson_type ===
        "snowboard" &&
        instructor.snowboard_license ===
        false
      ) {
        return res.status(400).json({
          message:
            "Ovaj instruktor nema licencu za snowboard."
        });
      }


      const createdLessons = [];


      // =====================================================
      // GRUPNI ČAS
      // =====================================================

      if (
        request.lesson_mode === "group"
      ) {

        if (
          request.group_package === "2h"
        ) {
          const busy =
            await isInstructorBusy(
              instructor_id,
              lesson_date,
              "10:00",
              "12:00"
            );


          if (busy) {
            return res.status(400).json({
              message:
                "Instruktor je zauzet u terminu 10:00–12:00."
            });
          }


          const lesson =
            await pool.query(
              `
              INSERT INTO lessons
              (
                request_id,
                instructor_id,
                lesson_type,
                lesson_date,
                start_time,
                end_time,
                status
              )
              VALUES
              (
                $1,$2,$3,$4,$5,$6,$7
              )
              RETURNING *
              `,
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


          createdLessons.push(
            lesson.rows[0]
          );
        }


        if (
          request.group_package ===
          "4h_no_lunch"
        ) {
          const busy =
            await isInstructorBusy(
              instructor_id,
              lesson_date,
              "10:00",
              "14:00"
            );


          if (busy) {
            return res.status(400).json({
              message:
                "Instruktor je zauzet u terminu 10:00–14:00."
            });
          }


          const lesson =
            await pool.query(
              `
              INSERT INTO lessons
              (
                request_id,
                instructor_id,
                lesson_type,
                lesson_date,
                start_time,
                end_time,
                status
              )
              VALUES
              (
                $1,$2,$3,$4,$5,$6,$7
              )
              RETURNING *
              `,
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


          createdLessons.push(
            lesson.rows[0]
          );
        }


        if (
          request.group_package ===
          "4h_lunch"
        ) {

          const busyMorning =
            await isInstructorBusy(
              instructor_id,
              lesson_date,
              "10:00",
              "12:00"
            );


          const busyAfternoon =
            await isInstructorBusy(
              instructor_id,
              lesson_date,
              "14:00",
              "16:00"
            );


          if (
            busyMorning ||
            busyAfternoon
          ) {
            return res.status(400).json({
              message:
                "Instruktor je zauzet u jednom od termina grupne nastave."
            });
          }


          const firstLesson =
            await pool.query(
              `
              INSERT INTO lessons
              (
                request_id,
                instructor_id,
                lesson_type,
                lesson_date,
                start_time,
                end_time,
                status
              )
              VALUES
              (
                $1,$2,$3,$4,$5,$6,$7
              )
              RETURNING *
              `,
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


          const secondLesson =
            await pool.query(
              `
              INSERT INTO lessons
              (
                request_id,
                instructor_id,
                lesson_type,
                lesson_date,
                start_time,
                end_time,
                status
              )
              VALUES
              (
                $1,$2,$3,$4,$5,$6,$7
              )
              RETURNING *
              `,
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


          createdLessons.push(
            firstLesson.rows[0],
            secondLesson.rows[0]
          );
        }

      } else {

        // =====================================================
        // INDIVIDUALNI ČAS
        // =====================================================

        const finalStartTime =
          start_time ||
          request.preferred_time;


        if (!finalStartTime) {
          return res.status(400).json({
            message:
              "Morate izabrati vreme za individualni čas."
          });
        }


        const minutes =
          Number(
            request.number_of_lessons
          ) * 60;


        const endTimeResult =
          await pool.query(
            `
            SELECT
              (
                $1::time +
                ($2 || ' minutes')::interval
              )::time AS end_time
            `,
            [
              finalStartTime,
              minutes
            ]
          );


        const endTime =
          endTimeResult.rows[0]
            .end_time;


        const busy =
          await isInstructorBusy(
            instructor_id,
            lesson_date,
            finalStartTime,
            endTime
          );


        if (busy) {
          return res.status(400).json({
            message:
              `Instruktor je zauzet u terminu ${finalStartTime}–${endTime}.`
          });
        }


        const lesson =
          await pool.query(
            `
            INSERT INTO lessons
            (
              request_id,
              instructor_id,
              lesson_type,
              lesson_date,
              start_time,
              end_time,
              status
            )
            VALUES
            (
              $1,$2,$3,$4,$5,$6,$7
            )
            RETURNING *
            `,
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


        createdLessons.push(
          lesson.rows[0]
        );
      }


      // =====================================================
      // STATUS ZAHTEVA
      // =====================================================

      await pool.query(
        `
        UPDATE lesson_requests
        SET status = $1
        WHERE id = $2
        `,
        [
          "approved",
          requestId
        ]
      );


      await logActivity({
        userId:
          req.user.id,

        action:
          "APPROVE_LESSON_REQUEST",

        entityType:
          "lesson_request",

        entityId:
          Number(requestId),

        details:
          `Zahtev je odobren i dodeljen instruktoru ID ${instructor_id}.`,

        ipAddress:
          getIpAddress(req)
      });


      res.json({
        message:
          "Zahtev je odobren i časovi su zakazani.",

        lessons:
          createdLessons
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
// REJECT REQUEST
// ADMIN / BOOKER
// =====================================================

router.post(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(
    "admin",
    "booker"
  ),
  async (req, res) => {
    try {
      const requestId =
        req.params.id;


      const rejectedRequest =
        await pool.query(
          `
          UPDATE lesson_requests
          SET status = $1
          WHERE id = $2
            AND status = 'pending'
          RETURNING *
          `,
          [
            "rejected",
            requestId
          ]
        );


      if (
        rejectedRequest.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Zahtev nije pronađen ili je već obrađen."
        });
      }


      await logActivity({
        userId:
          req.user.id,

        action:
          "REJECT_LESSON_REQUEST",

        entityType:
          "lesson_request",

        entityId:
          Number(requestId),

        details:
          "Zahtev za čas je odbijen.",

        ipAddress:
          getIpAddress(req)
      });


      res.json({
        message:
          "Zahtev je odbijen.",

        request:
          rejectedRequest.rows[0]
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
// CANCEL REQUEST
// SAMO VLASNIK ZAHTEVA - CLIENT
// =====================================================

router.post(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const requestId =
        req.params.id;

      const {
        cancel_reason
      } = req.body;


      // =====================================================
      // PROVERA VLASNIŠTVA
      // =====================================================

      const requestResult =
        await pool.query(
          `
          SELECT *
          FROM lesson_requests
          WHERE id = $1
            AND user_id = $2
          `,
          [
            requestId,
            req.user.id
          ]
        );


      if (
        requestResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Zahtev nije pronađen ili ne pripada prijavljenom korisniku."
        });
      }


      const request =
        requestResult.rows[0];


      // Već obrađen ili već otkazan zahtev ne može ponovo da se otkazuje
      if (
        request.status === "cancelled"
      ) {
        return res.status(400).json({
          message:
            "Zahtev je već otkazan."
        });
      }


      if (
        request.status !== "pending"
      ) {
        return res.status(400).json({
          message:
            "Moguće je otkazati samo zahtev koji još nije obrađen."
        });
      }


      // =====================================================
      // OTKAZIVANJE
      // =====================================================

      const cancelledRequest =
        await pool.query(
          `
          UPDATE lesson_requests
          SET
            status = $1,
            cancel_reason = $2
          WHERE id = $3
            AND user_id = $4
          RETURNING *
          `,
          [
            "cancelled",
            cancel_reason || null,
            requestId,
            req.user.id
          ]
        );


      if (
        cancelledRequest.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Zahtev nije moguće otkazati."
        });
      }


      await logActivity({
        userId:
          req.user.id,

        action:
          "CANCEL_LESSON_REQUEST",

        entityType:
          "lesson_request",

        entityId:
          Number(requestId),

        details:
          cancel_reason
            ? `Korisnik je otkazao zahtev. Razlog: ${cancel_reason}`
            : "Korisnik je otkazao zahtev.",

        ipAddress:
          getIpAddress(req)
      });


      res.json({
        message:
          "Zahtev je uspešno otkazan.",

        request:
          cancelledRequest.rows[0]
      });


    } catch (err) {
      console.log(
        "CANCEL REQUEST ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Došlo je do greške prilikom otkazivanja zahteva.",

        error:
          err.message
      });
    }
  }
);


module.exports = router;