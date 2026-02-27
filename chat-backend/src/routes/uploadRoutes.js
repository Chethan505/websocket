const router = require("express").Router();
const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


router.post("/", upload.single("file"), (req, res) => {
  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype
  });
});

module.exports = router;
