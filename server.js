const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const rootDir = path.join(__dirname);

// Serve static assets from the project root
app.use(express.static(rootDir, { index: "index.html" }));

// Health checker should always return the raw script with text/plain
app.get("/healthchecker", (req, res) => {
  res.type("text/plain");
  res.sendFile(path.join(rootDir, "health_checker"));
});

// Fallback to index.html for other routes (optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Soul:23 server listening on port ${port}`);
});
