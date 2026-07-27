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
fs.copyFileSync(path.join(root, "scripts", "server.cjs"), path.join(output, "server", "index.js"));
