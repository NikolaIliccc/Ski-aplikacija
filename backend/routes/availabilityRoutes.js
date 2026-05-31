const router = require("express").Router();

const pool = require("../db/db");

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00"
];

const getEndTime = async (startTime, numberOfLessons = 1) => {
  const minutes = Number(numberOfLessons) * 60;

  const result = await pool.query(
    "SELECT ($1::time + ($2 || ' minutes')::interval)::time AS end_time",
    [startTime, minutes]
  );

  return result.rows[0].end_time.slice(0, 5);
};

const isInstructorBusy = async (instructorId, date, startTime, endTime) => {
  const lessonResult = await pool.query(
    `SELECT *
     FROM lessons
     WHERE instructor_id = $1
     AND lesson_date::date = $2::date
     AND status = 'scheduled'
     AND (
       start_time < $4::time
       AND end_time > $3::time
     )`,
    [instructorId, date, startTime, endTime]
  );

  if (lessonResult.rows.length > 0) {
    return true;
  }

  const unavailableResult = await pool.query(
    `SELECT *
     FROM instructor_unavailability
     WHERE instructor_id = $1
     AND unavailable_date::date = $2::date
     AND (
       start_time < $4::time
       AND end_time > $3::time
     )`,
    [instructorId, date, startTime, endTime]
  );

  return unavailableResult.rows.length > 0;
};

// GET AVAILABLE TIMES
router.get("/", async (req, res) => {
  try {
    const {
      date,
      type,
      mode,
      group_package,
      number_of_lessons
    } = req.query;

    if (!date || !type || !mode) {
      return res.status(400).json({
        message: "Datum, tip časa i mod nastave su obavezni."
      });
    }

    let instructorsResult;

    if (type === "ski") {
      instructorsResult = await pool.query(
        `SELECT *
         FROM instructors
         WHERE ski_license = true`
      );
    } else if (type === "snowboard") {
      instructorsResult = await pool.query(
        `SELECT *
         FROM instructors
         WHERE snowboard_license = true`
      );
    } else {
      return res.status(400).json({
        message: "Tip časa mora biti ski ili snowboard."
      });
    }

    const instructors = instructorsResult.rows;

    if (instructors.length === 0) {
      return res.json([]);
    }

    const availableTimes = [];

    if (mode === "individual") {
      const lessonsCount = Number(number_of_lessons) || 1;

      for (const slot of timeSlots) {
        const endTime = await getEndTime(slot, lessonsCount);

        let hasFreeInstructor = false;

        for (const instructor of instructors) {
          const busy = await isInstructorBusy(
            instructor.id,
            date,
            slot,
            endTime
          );

          if (!busy) {
            hasFreeInstructor = true;
            break;
          }
        }

        if (hasFreeInstructor) {
          availableTimes.push({
            start_time: slot,
            end_time: endTime,
            label: `${slot}–${endTime}`
          });
        }
      }
    }

    if (mode === "group") {
      let ranges = [];

      if (group_package === "2h") {
        ranges = [{ start: "10:00", end: "12:00" }];
      } else if (group_package === "4h_no_lunch") {
        ranges = [{ start: "10:00", end: "14:00" }];
      } else if (group_package === "4h_lunch") {
        ranges = [
          { start: "10:00", end: "12:00" },
          { start: "14:00", end: "16:00" }
        ];
      } else {
        return res.status(400).json({
          message: "Izaberite validan paket grupne nastave."
        });
      }

      let hasFreeInstructor = false;

      for (const instructor of instructors) {
        let instructorBusy = false;

        for (const range of ranges) {
          const busy = await isInstructorBusy(
            instructor.id,
            date,
            range.start,
            range.end
          );

          if (busy) {
            instructorBusy = true;
            break;
          }
        }

        if (!instructorBusy) {
          hasFreeInstructor = true;
          break;
        }
      }

      if (hasFreeInstructor) {
        availableTimes.push({
          start_time: "10:00",
          end_time:
            group_package === "2h"
              ? "12:00"
              : group_package === "4h_no_lunch"
              ? "14:00"
              : "16:00",
          label:
            group_package === "2h"
              ? "10:00–12:00"
              : group_package === "4h_no_lunch"
              ? "10:00–14:00"
              : "10:00–12:00 i 14:00–16:00"
        });
      }
    }

    res.json(availableTimes);
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;