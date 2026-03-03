const express = require('express');
const multer = require('multer');
const path = require('path');
const ragController = require('../controllers/ragController');

const router = express.Router();

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid overwrites
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only .csv files are allowed!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Route to upload and process a CSV file
router.post('/rag/upload', upload.single('csvFile'), ragController.uploadAndProcessCsv);

// Route to generate an insight from the processed CSV
router.post('/rag/query', ragController.generateInsight);

module.exports = router;
