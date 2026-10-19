import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { buildNotification } from "./engine.js";
import { TEMPLATES } from "./templates.js";

const PORT = process.env.PORT || 3000;
const INDEX_URL = new URL("../public/index.html", import.meta.url);

const json = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST" });
    return res.end();
  }
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(readFileSync(INDEX_URL));
  }
  if (req.method === "GET" && req.url === "/health") return json(res, 200, { status: "ok" });
  if (req.method === "GET" && req.url === "/api/templates") return json(res, 200, TEMPLATES);

  if (req.method === "POST" && req.url === "/api/notifications/next") {
    let raw = "";
    req.on("data", c => (raw += c));
    req.on("end", () => {
      try {
        const { user, now } = JSON.parse(raw || "{}");
        if (!user?.name) return json(res, 400, { error: "Field 'user.name' wajib diisi" });
        const notification = buildNotification(user, now ? new Date(now) : new Date());
        json(res, 200, { notification });
      } catch {
        json(res, 400, { error: "JSON tidak valid" });
      }
    });
    return;
  }
  json(res, 404, { error: "Not found" });
}).listen(PORT, () => console.log(`Notification engine di http://localhost:${PORT}`));
