const Tesseract = require("tesseract.js");

Tesseract.recognize(
  "image.png",     // path to image
  "eng",           // language
  {
    logger: m => console.log(m) // progress updates
  }
).then(({ data: { text } }) => {
  console.log("\n--- TEXT FOUND ---\n");
  console.log(text);
}).catch(err => {
  console.error(err);
});
