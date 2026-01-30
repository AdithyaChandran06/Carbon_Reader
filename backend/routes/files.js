const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const UploadedFile = require("../models/UploadedFile");
const { processCSVFile } = require("../utils/csvProcessor");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|pdf|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Only CSV, PDF, and Excel files are allowed"));
  },
});

// POST /api/files/upload - Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFile = new UploadedFile({
      fileName: req.file.originalname,
      sourceType: req.body.sourceType || "Other",
      status: "Processing",
      filePath: req.file.path,
    });

    await uploadedFile.save();

    // Process the file asynchronously
    processFileAsync(uploadedFile, req.file.path);

    res.status(201).json({
      id: uploadedFile._id,
      fileName: uploadedFile.fileName,
      sourceType: uploadedFile.sourceType,
      status: uploadedFile.status,
      uploadDate: uploadedFile.uploadDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Async function to process files
async function processFileAsync(uploadedFile, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === ".csv") {
      // Process CSV file
      const emissionEntries = await processCSVFile(
        filePath,
        uploadedFile.sourceType,
        uploadedFile._id
      );
      
      console.log(`✅ Processed ${emissionEntries.length} emission entries from ${uploadedFile.fileName}`);
      
      uploadedFile.status = "Processed";
      await uploadedFile.save();
    } else {
      // For PDF and Excel files, mark as processed for now
      // You can add PDF/Excel processing later
      uploadedFile.status = "Processed";
      await uploadedFile.save();
    }
  } catch (error) {
    console.error("Error processing file:", error);
    uploadedFile.status = "Error";
    uploadedFile.errorMessage = error.message;
    await uploadedFile.save();
  }
}

// GET /api/files - Get all uploaded files
router.get("/", async (req, res) => {
  try {
    const files = await UploadedFile.find().sort({ uploadDate: -1 });
    
    const formattedFiles = files.map((file) => ({
      id: file._id,
      fileName: file.fileName,
      sourceType: file.sourceType,
      status: file.status,
      uploadDate: file.uploadDate.toLocaleDateString("en-US"),
      errorMessage: file.errorMessage,
    }));

    res.json(formattedFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:id - Delete a file
router.delete("/:id", async (req, res) => {
  try {
    const file = await UploadedFile.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
