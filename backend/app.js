require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const lessonRequestRoutes = require("./routes/lessonRequestRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const unavailabilityRoutes = require("./routes/unavailabilityRoutes");
const availableInstructorRoutes = require("./routes/availableInstructorRoutes");
const changeRequestRoutes = require("./routes/changeRequestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/lesson-requests", lessonRequestRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/unavailability", unavailabilityRoutes);
app.use("/api/available-instructors", availableInstructorRoutes);
app.use("/api/change-requests", changeRequestRoutes);

app.get("/", (req, res) => {
  res.send("API radi");
});

app.listen(5000, () => {
  console.log("Server pokrenut na portu 5000");
});