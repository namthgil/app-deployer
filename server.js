const http = require("http");
const fs = require("fs");
const path = require("path");

const APPS_DIR = process.env.APPS_DIR || "/var/www/apps";
const PORT = process.env.PORT || 4200;

if (!fs.existsSync(APPS_DIR)) fs.mkdirSync(APPS_DIR, { recursive: true });

function listApps() {
  try {
    return fs
      .readdirSync(APPS_DIR)
      .filter((f) => {
        const p = path.join(APPS_DIR, f);
        return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html"));
      })
      .map((name) => {
        const stat = fs.statSync(path.join(APPS_DIR, name, "index.html"));
        return { name, updated: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
  } catch {
    return [];
  }
}

function deployApp(name, html) {
  if (!/^[a-zA-Z0-9_-]+$/.test(name))
    throw new Error("Invalid name — use letters, numbers, hyphens, underscores only");
  const appPath = path.join(APPS_DIR, name);
  fs.mkdirSync(appPath, { recursive: true });
  fs.writeFileSync(path.join(appPath, "index.html"), html, "utf8");
}

function deleteApp(name) {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error("Invalid app name");
  const appPath = path.join(APPS_DIR, name);
  if (!fs.existsSync(appPath)) throw new Error("App not found");
  fs.rmSync(appPath, { recursive: true, force: true });
}

// Minimal multipart parser (zero dependencies)
function parseMultipart(buffer, boundary) {
  const sep = Buffer.from("--" + boundary);
  const parts = [];
  let pos = 0;
  while (pos < buffer.length) {
    const sepIdx = indexOf(buffer, sep, pos);
    if (sepIdx === -1) break;
    const hStart = sepIdx + sep.length + 2;
    const hEnd = indexOf(buffer, Buffer.from("\r\n\r\n"), hStart);
    if (hEnd === -1) break;
    const headers = buffer.slice(hStart, hEnd).toString();
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    const dStart = hEnd + 4;
    const nextSep = indexOf(buffer, sep, dStart);
    if (nextSep === -1) break;
    parts.push({
      name: nameMatch?.[1],
      filename: fileMatch?.[1],
      data: buffer.slice(dStart, nextSep - 2),
    });
    pos = nextSep;
  }
  return parts;
}

function indexOf(buf, search, offset = 0) {
  outer: for (let i = offset; i <= buf.length - search.length; i++) {
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function readBody(req) {
  return new Promise((res, rej) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => res(Buffer.concat(chunks)));
    req.on("error", rej);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (url.pathname === "/api/apps" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(listApps()));
  }

  if (url.pathname === "/api/deploy" && req.method === "POST") {
    try {
      const ct = req.headers["content-type"] || "";
      let appName, html;
      if (ct.includes("multipart/form-data")) {
        const boundary = ct.split("boundary=")[1];
        const body = await readBody(req);
        const parts = parseMultipart(body, boundary);
        const namePart = parts.find((p) => p.name === "appName");
        const filePart = parts.find((p) => p.name === "file");
        if (!namePart || !filePart) throw new Error("Missing appName or file");
        appName = namePart.data.toString().trim().toLowerCase().replace(/\s+/g, "-");
        html = filePart.data.toString("utf8");
      } else {
        const body = await readBody(req);
        const parsed = JSON.parse(body.toString());
        appName = parsed.name.trim().toLowerCase().replace(/\s+/g, "-");
        html = parsed.html;
      }
      deployApp(appName, html);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, name: appName }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (url.pathname.startsWith("/api/apps/") && req.method === "DELETE") {
    const name = decodeURIComponent(url.pathname.replace("/api/apps/", ""));
    try {
      deleteApp(name);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Serve deployer UI
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const uiPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(uiPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(fs.readFileSync(uiPath));
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Deployer API listening on 127.0.0.1:${PORT}`);
  console.log(`Apps directory: ${APPS_DIR}`);
});
