const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const clientRoot = path.resolve(__dirname, "..");
const types = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8" };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = path.resolve(clientRoot, requested);
  if (!file.startsWith(clientRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(clientRoot, "index.html");
  response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(file).pipe(response);
}).listen(Number(process.env.PORT || 3000), "0.0.0.0");
