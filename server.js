const express = require("express");
const path = require("path");

const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3001;
const rootDir = path.join(__dirname);

// Serve static assets from the project root
app.use(express.static(rootDir, { index: "index.html" }));

// Health checker should always return the raw script with text/plain
app.get("/healthchecker", (req, res) => {
  res.type("text/plain");
  res.sendFile(path.join(rootDir, "scripts", "health_checker"));
});

// Standard health check endpoint for monitoring with VPS ping
app.get("/health", (req, res) => {
  const vpsIp = "31.97.41.188";
  // Ping with count 1 and timeout 1 second
  exec(`ping -c 1 -W 1 ${vpsIp}`, (error, stdout, stderr) => {
    const isAlive = !error;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        vps_ping: {
          target: vpsIp,
          alive: isAlive,
          output: isAlive ? "VPS Reachable" : "VPS Unreachable",
        },
      },
    });
  });
});

// Fallback to index.html for other routes (optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Soul:23 server listening on port ${port}`);
});
