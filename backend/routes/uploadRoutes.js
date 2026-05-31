const router = require("express").Router();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post(
  "/instructors/:id/image",
  authMiddleware,
  roleMiddleware("admin", "booker"),
  upload.single("image"),
  async (req, res) => {
    try {
      const instructorId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          message: "Slika nije poslata."
        });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "ski-school/instructors"
      });

      const updatedInstructor = await pool.query(
        `UPDATE instructors
         SET image_url = $1
         WHERE id = $2
         RETURNING *`,
        [uploadedImage.secure_url, instructorId]
      );

      res.json({
        message: "Slika instruktora je uspešno uploadovana.",
        image_url: uploadedImage.secure_url,
        instructor: updatedInstructor.rows[0]
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;