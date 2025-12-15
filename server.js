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

// Magic link para redirigir a la app de Telegram según plataforma
app.get("/telegram", (req, res) => {
  const uaRaw = req.headers["user-agent"] || "";
  const ua = uaRaw.toLowerCase();

  // Log para debug
  console.log("[/telegram] User-Agent:", uaRaw);

  // Permitir forzar plataforma por query param: ?platform=ios|android
  const platform = (req.query.platform || "").toString().toLowerCase();

  const isIOSQuery = platform === "ios";
  const isAndroidQuery = platform === "android";

  const isIOSUA =
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod") ||
    ua.includes("ios");
  const isAndroidUA = ua.includes("android");

  const isIOS = isIOSQuery || isIOSUA;
  const isAndroid = isAndroidQuery || isAndroidUA;

  if (isIOS) {
    // iOS -> App Store
    return res.redirect(
      302,
      "https://apps.apple.com/es/app/telegram-messenger/id686449807"
    );
  }

  if (isAndroid) {
    // Android -> Google Play
    return res.redirect(
      302,
      "https://play.google.com/store/apps/details?id=org.telegram.messenger&pcampaignid=web_share"
    );
  }

  // Fallback: página oficial de descargas de Telegram
  return res.redirect(302, "https://telegram.org/apps");
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
