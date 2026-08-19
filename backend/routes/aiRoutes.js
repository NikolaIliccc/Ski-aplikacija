const express = require("express");
const OpenAI = require("openai");

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post(
  "/skill-assessment",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const {
        disciplina,
        iskustvo,
        koristi_zicaru,
        kontrolise_brzinu,
        paralelni_zavoji,
        sigurnost_na_stazi,
        godine
      } = req.body;

      // =====================================================
      // VALIDACIJA PODATAKA
      // =====================================================

      if (
        !disciplina ||
        !iskustvo ||
        typeof koristi_zicaru !== "boolean" ||
        typeof kontrolise_brzinu !== "boolean" ||
        typeof paralelni_zavoji !== "boolean" ||
        !sigurnost_na_stazi ||
        godine === undefined ||
        godine === null
      ) {
        return res.status(400).json({
          message:
            "Morate popuniti sve podatke potrebne za AI procenu."
        });
      }

      if (
        disciplina !== "ski" &&
        disciplina !== "snowboard"
      ) {
        return res.status(400).json({
          message:
            "Disciplina mora biti ski ili snowboard."
        });
      }

      const brojGodina = Number(godine);

      if (
        Number.isNaN(brojGodina) ||
        brojGodina <= 0 ||
        brojGodina > 100
      ) {
        return res.status(400).json({
          message:
            "Godine korisnika nisu validne."
        });
      }

      // =====================================================
      // OPENAI POZIV
      // =====================================================

      const response = await openai.responses.create({
        model: "gpt-5-mini",

        input: [
          {
            role: "system",

            content: `
Ti si AI modul web informacionog sistema ski škole.

Tvoj zadatak je da na osnovu odgovora korisnika proceniš njegov trenutni nivo znanja u skijanju ili snowboardu i preporučiš odgovarajući oblik nastave.

Procena predstavlja pomoć korisniku prilikom izbora časa. Konačnu odluku korisnik može promeniti kasnije u aplikaciji.

Odgovor i obrazloženje moraju biti na srpskom jeziku.

Dozvoljeni nivoi su isključivo:

beginner
intermediate
advanced

Dozvoljeni tipovi nastave su isključivo:

individual
group


PRAVILA ZA PROCENU NIVOA:

Beginner:
Korisnik još razvija osnovnu kontrolu brzine, pravca, zaustavljanja i zavoja ili nema dovoljno prethodnog iskustva.

Intermediate:
Korisnik je uglavnom samostalan na stazi, ume da kontroliše brzinu i bezbedno se zaustavlja i poseduje osnovnu tehniku vožnje. Paralelni zavoji nisu obavezni za intermediate nivo.

Advanced:
Korisnik poseduje razvijenu tehniku, sigurnu kontrolu brzine i pravca, izvodi naprednije zavoje i samostalno se snalazi na zahtevnijim stazama.


PRAVILA ZA PREPORUKU TIPA NASTAVE:

1. Grupna nastava je dostupna samo korisnicima koji imaju 12 godina ili manje.

2. Ako korisnik ima više od 12 godina, preporuči individualni čas.

3. Ako korisnik ima 12 godina ili manje, može biti sposoban za grupnu nastavu ako:
- samostalno koristi žičaru
- bezbedno kontroliše brzinu
- može bezbedno da se zaustavi
- može samostalno da prati grupu

4. Paralelni zavoji NISU uslov za grupnu nastavu.

5. Ako dete ima 12 godina ili manje, samostalno koristi žičaru i bezbedno kontroliše brzinu i zaustavljanje, grupna nastava je dozvoljena čak i ako još ne izvodi paralelne zavoje.

6. Ako dete ispunjava uslove za grupnu nastavu i njegova tehnika je dovoljno stabilna, slobodno preporuči group.

7. Ako dete ispunjava uslove za grupnu nastavu, ali još ima tehničke nedostatke, možeš preporučiti individualni čas radi bržeg napretka. U tom slučaju u obrazloženju jasno napiši da korisnik ipak ispunjava uslove za grupnu nastavu.

8. Ako korisnik prvi put skija ili vozi snowboard, preporuči individualni čas.

9. Ako korisnik ne koristi žičaru samostalno ili ne može bezbedno da kontroliše brzinu i da se zaustavi, preporuči individualni čas.

10. Nemoj preporučiti individualni čas samo zato što korisnik ne radi paralelne zavoje.

11. Ako dete do 12 godina koristi žičaru samostalno, kontroliše brzinu i bezbedno se zaustavlja, smatraj ga sposobnim za grupnu nastavu.

Obrazloženje napiši jasno i kratko, u najviše tri rečenice.
            `
          },

          {
            role: "user",

            content: `
Proceni korisnika na osnovu sledećih podataka.

Disciplina:
${disciplina}

Godine korisnika:
${brojGodina}

Prethodno iskustvo:
${iskustvo}

Samostalno koristi žičaru:
${koristi_zicaru ? "Da" : "Ne"}

Može bezbedno da kontroliše brzinu i da se zaustavi:
${kontrolise_brzinu ? "Da" : "Ne"}

Može da izvodi paralelne zavoje:
${paralelni_zavoji ? "Da" : "Ne"}

Sigurnost na stazi:
${sigurnost_na_stazi}

Na osnovu svih podataka zajedno odredi:
- procenjeni nivo znanja
- preporučeni tip časa
- kratko obrazloženje preporuke
            `
          }
        ],

        text: {
          format: {
            type: "json_schema",
            name: "procena_nivoa",
            strict: true,

            schema: {
              type: "object",

              properties: {
                procenjeni_nivo: {
                  type: "string",
                  enum: [
                    "beginner",
                    "intermediate",
                    "advanced"
                  ]
                },

                preporuceni_tip_casa: {
                  type: "string",
                  enum: [
                    "individual",
                    "group"
                  ]
                },

                obrazlozenje: {
                  type: "string"
                }
              },

              required: [
                "procenjeni_nivo",
                "preporuceni_tip_casa",
                "obrazlozenje"
              ],

              additionalProperties: false
            }
          }
        },

        store: false
      });

      // =====================================================
      // PROVERA AI ODGOVORA
      // =====================================================

      if (!response.output_text) {
        return res.status(500).json({
          message:
            "AI nije vratio rezultat procene."
        });
      }

      // =====================================================
      // PARSIRANJE ODGOVORA
      // =====================================================

      let aiRezultat;

      try {
        aiRezultat = JSON.parse(
          response.output_text
        );
      } catch (err) {
        console.log(
          "Greška pri parsiranju AI odgovora:",
          response.output_text
        );

        return res.status(500).json({
          message:
            "AI odgovor nije moguće obraditi."
        });
      }

      // =====================================================
      // VALIDACIJA REZULTATA
      // =====================================================

      const dozvoljeniNivoi = [
        "beginner",
        "intermediate",
        "advanced"
      ];

      const dozvoljeniTipoviCasa = [
        "individual",
        "group"
      ];

      if (
        !dozvoljeniNivoi.includes(
          aiRezultat.procenjeni_nivo
        )
      ) {
        return res.status(500).json({
          message:
            "AI je vratio neispravan nivo znanja."
        });
      }

      if (
        !dozvoljeniTipoviCasa.includes(
          aiRezultat.preporuceni_tip_casa
        )
      ) {
        return res.status(500).json({
          message:
            "AI je vratio neispravan tip časa."
        });
      }

      // =====================================================
      // OBAVEZNA POSLOVNA PRAVILA
      // =====================================================

      // Stariji od 12 godina ne mogu u grupu
      if (brojGodina > 12) {
        aiRezultat.preporuceni_tip_casa =
          "individual";
      }

      // Ako ne koristi žičaru ili ne kontroliše brzinu,
      // ne treba da ide u grupu
      if (
        brojGodina <= 12 &&
        (
          koristi_zicaru === false ||
          kontrolise_brzinu === false
        )
      ) {
        aiRezultat.preporuceni_tip_casa =
          "individual";
      }

      // =====================================================
      // ČUVANJE U POSTOJEĆU ai_procene TABELU
      // =====================================================

      const novaProcena =
        await pool.query(
          `
          INSERT INTO ai_procene
          (
            korisnik_id,
            disciplina,
            iskustvo,
            koristi_zicaru,
            kontrolise_brzinu,
            paralelni_zavoji,
            sigurnost_na_stazi,
            procenjeni_nivo,
            preporuceni_tip_casa,
            obrazlozenje
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
          )
          RETURNING *
          `,
          [
            req.user.id,
            disciplina,
            iskustvo,
            koristi_zicaru,
            kontrolise_brzinu,
            paralelni_zavoji,
            sigurnost_na_stazi,
            aiRezultat.procenjeni_nivo,
            aiRezultat.preporuceni_tip_casa,
            aiRezultat.obrazlozenje
          ]
        );

      // =====================================================
      // ODGOVOR FRONTENDU
      // =====================================================

      res.json({
        message:
          "AI procena je uspešno izvršena.",

        procena:
          novaProcena.rows[0]
      });

    } catch (err) {
      console.log(
        "AI ROUTES ERROR:",
        err
      );

      if (err.status === 401) {
        return res.status(500).json({
          message:
            "OpenAI API ključ nije validan."
        });
      }

      if (err.status === 429) {
        return res.status(500).json({
          message:
            "OpenAI API trenutno nema raspoloživ kredit ili je dostignuto ograničenje zahteva."
        });
      }

      res.status(500).json({
        message:
          "Došlo je do greške prilikom AI procene.",

        error:
          err.message
      });
    }
  }
);

module.exports = router;