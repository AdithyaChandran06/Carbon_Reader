const mongoose = require("mongoose");

const uploadedFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Processed", "Error"],
      default: "Pending",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    errorMessage: {
      type: String,
    },
    filePath: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UploadedFile", uploadedFileSchema);
