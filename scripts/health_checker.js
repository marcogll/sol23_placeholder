const fs = require("fs/promises");
const path = require("path");

const STATUSPAGE_SERVICES = new Set(["openai", "canva", "cloudflare"]);
const DEFAULT_TIMEOUT_MS = 10_000;

const getWebhookUrls = () => {
  const value = process.env.WEBHOOK_URLS || "";
  return value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};

const checkUrl = async (url) => {
  try {
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "HealthCheckMonitor/1.0" },
    });
    return response.status;
  } catch {
    return 0;
  }
};

const checkVpsHealthEndpoint = async (url) => {
  try {
    const response = await fetchWithTimeout(url);
    if (response.status !== 200) {
      return `🔴 Caído (Endpoint status: ${response.status})`;
    }
    const data = await response.json();
    const alive = data?.checks?.vps_ping?.alive;
    if (alive) {
      return "🟢 OK (VPS Reachable)";
    }
    return "🔴 Caído (VPS reporta 'alive': false)";
  } catch (error) {
    return `🔴 Error Conexión (${error.message})`;
  }
};

const checkFormbricksHealth = async (url) => {
  try {
    const response = await fetchWithTimeout(url, {}, 8_000);
    if (response.status !== 200) {
      return `🔴 Caído (Código: ${response.status})`;
    }
    const data = await response.json().catch(() => null);
    if (data?.status === "ok") {
      return "🟢 OK (API Health: ok)";
    }
    if (data?.status) {
      return `🟡 Advertencia (${data.status})`;
    }
    return "🟡 Advertencia (No JSON)";
  } catch {
    return "🔴 Caído (Error red)";
  }
};

const getStatusPageStatus = async (baseUrl) => {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v2/summary.json`;
  try {
    const response = await fetchWithTimeout(url, {}, 8_000);
    if (response.status !== 200) {
      return `🔴 Caído (${response.status})`;
    }
    const data = await response.json();
    const indicator = data?.status?.indicator;
    const description = data?.status?.description;
    if (indicator === "none") {
      return `🟢 OK (${description})`;
    }
    return `🟡 Advertencia (${description})`;
  } catch {
    return "🔴 Error verificación";
  }
};

const getGeminiStatus = async (displayUrl) => {
  const incidentsUrl = "https://status.cloud.google.com/incidents.json";
  try {
    const response = await fetchWithTimeout(incidentsUrl, {}, 8_000);
    if (response.status === 200) {
      const incidents = await response.json();
      const active = incidents.filter((incident) => {
        if (incident.end) return false;
        const serviceName = (incident.service_name || "").toLowerCase();
        return (
          serviceName.includes("gemini") ||
          serviceName.includes("vertex") ||
          serviceName.includes("generative")
        );
      });
      if (active.length === 0) {
        return "🟢 OK (Sin incidentes en Google AI)";
      }
      return `🟡 Advertencia (${active.length} incidentes activos)`;
    }
    const backupStatus = humanState(await checkUrl(displayUrl));
    return backupStatus;
  } catch {
    return "🔴 Error de conexión";
  }
};

const humanState = (code) => {
  if (code === 200) return `🟢 OK (${code})`;
  if ([301, 302, 307, 308].includes(code)) return `🟢 OK (Redirección ${code})`;
  if ([401, 403, 404].includes(code)) return `🟡 Advertencia (${code})`;
  return `🔴 Caído (${code})`;
};

const buildSection = async (dictionary) => {
  const output = {};

  for (const [name, urlOrIp] of Object.entries(dictionary)) {
    let statusMessage;

    if (name === "vps_soul23") {
      statusMessage = await checkVpsHealthEndpoint(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (STATUSPAGE_SERVICES.has(name)) {
      statusMessage = await getStatusPageStatus(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (name === "google_gemini") {
      statusMessage = await getGeminiStatus(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (name === "formbricks") {
      statusMessage = await checkFormbricksHealth(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else {
      const statusCode = await checkUrl(urlOrIp);
      output[`${name}_status`] = statusCode;
      output[`${name}_state`] = humanState(statusCode);
    }

    output[`${name}_url`] = urlOrIp;
  }

  return output;
};

const postWebhooks = async (payload) => {
  const urls = getWebhookUrls();
  if (!urls.length) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        await fetchWithTimeout(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          10_000
        );
      } catch {
        // Silenciar errores individuales de webhook para no romper el resto del proceso
      }
    })
  );
};

const runHealthChecker = async () => {
  const start = Date.now();
  const sitesPath = path.join(__dirname, "..", "data", "sites.json");
  const raw = await fs.readFile(sitesPath, "utf8");
  const sites = JSON.parse(raw);

  const result = {
    timestamp: new Date().toISOString(),
    internos: await buildSection(sites.internos || {}),
    empresa: await buildSection(sites.sitios_empresa || {}),
    externos: await buildSection(sites.externos || {}),
  };

  const duration = (Date.now() - start) / 1000;
  result.execution_time_seconds = Number(duration.toFixed(2));

  await postWebhooks(result);
  return result;
};

module.exports = { runHealthChecker };

if (require.main === module) {
  runHealthChecker()
    .then((data) => {
      console.log(JSON.stringify(data, null, 4));
    })
    .catch((error) => {
      console.error(
        JSON.stringify(
          { error: "Health checker failed", details: error.message },
          null,
          4
        )
      );
      process.exit(1);
    });
}
