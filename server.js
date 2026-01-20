const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

async function preprocessImage(inputPath) {
    const outputPath = inputPath + "-processed.png"; // define it
  
    await sharp(inputPath)
      .resize({ width: 2000 })
      .grayscale()
      .normalize()
      .sharpen()
      .toFile(outputPath); // use outputPath
  
    return outputPath; // return it
  }
  

const app = express();
app.use(cors());

// Configure Multer
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const Tesseract = require("tesseract.js");

const fs = require("fs");

app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
  
    let processedPath;
    try {
      // Preprocess image
      processedPath = await preprocessImage(req.file.path);
  
      // OCR the processed image
      const result = await Tesseract.recognize(
        processedPath,
        "eng",
        {
          tessedit_pageseg_mode: 6,
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-() "
        }
      );
  
      // Filter by confidence
      const words = result?.data?.words;
      let cleanedText = "";
      if (words && words.length > 0) {
        cleanedText = words
          .filter(w => w.confidence > 70)
          .map(w => w.text)
          .join(" ");
      } else {
        cleanedText = result?.data?.text || "";
      }
  
      // Optional corrections
      cleanedText = cleanedText.replace(/0/g, "O"); // zero → O
      cleanedText = cleanedText.replace(/1/g, "I"); // one → I
  
      res.json({
        cleanedText,
        rawText: result?.data?.text || ""
      });
  
    } catch (error) {
      console.error("OCR ERROR:", error);
      res.status(500).json({
        error: "OCR failed",
        details: error.message || error
      });
    } finally {
      // Cleanup files
      if (req.file?.path) fs.unlinkSync(req.file.path);
      if (processedPath) fs.unlinkSync(processedPath);
    }
  });
  
  
  



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});