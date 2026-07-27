const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const vite = path.join(root, "node_modules", "vite", "bin", "vite.js");
const output = path.join(root, "dist");

execFileSync(process.execPath, [vite, "build"], { cwd: root, stdio: "inherit" });
fs.mkdirSync(path.join(output, "server"), { recursive: true });
fs.mkdirSync(path.join(output, ".openai"), { recursive: true });
fs.copyFileSync(path.join(root, ".openai", "hosting.json"), path.join(output, ".openai", "hosting.json"));
const document = fs.readFileSync(path.join(output, "client", "index.html"), "utf8");
const worker = `export default { fetch() { return new Response(${JSON.stringify(document)}, { headers: { "content-type": "text/html; charset=utf-8" } }); } };\n`;
fs.writeFileSync(path.join(output, "server", "index.js"), worker, "utf8");
