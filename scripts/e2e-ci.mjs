import process from "node:process";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { tmpdir } from "node:os";
import { createConnection } from "node:net";
import { resolve } from "node:path";

const apiUrl = "http://localhost:4300/api/v1";
const webUrl = "http://localhost:4373";
const rawUrl = process.env.DATABASE_URL || "";
const host = (() => { try { return new URL(rawUrl).hostname; } catch { return ""; } })();
const localAllowed = process.env.CI === "true" || process.env.QA_SEED_ALLOW_LOCAL === "1";
if (rawUrl.toLowerCase().includes("ep-hidden-dew") || !localAllowed || !["localhost", "127.0.0.1"].includes(host)) {
  console.error("e2e:ci abortado: requiere una BD localhost/127.0.0.1 con CI=true o QA_SEED_ALLOW_LOCAL=1.");
  process.exit(1);
}

const base = { ...process.env, NODE_ENV: "development", API_PORT: "4300", WEB_ORIGIN: webUrl,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "ci-only-fictitious-access-key-for-tests",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "ci-only-fictitious-refresh-key-for-tests",
  MAIL_DRIVER: "console", STORAGE_DRIVER: "local", ENABLE_JOBS: "false",
  E2E_API_URL: apiUrl, E2E_WEB_URL: webUrl };
const logDir = resolve(process.env.RUNNER_TEMP || tmpdir(), "ua-e2e-ci");
await mkdir(logDir, { recursive: true });
const apiLog = createWriteStream(resolve(logDir, "api.log"), { flags: "w" });
let apiServer, webServer;

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolveRun() : reject(new Error(`${command} terminó con ${code ?? signal}`)));
  });
}
function start(args, cwd, env, log) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  if (log) { child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false }); }
  else { child.stdout.pipe(process.stdout); child.stderr.pipe(process.stderr); }
  return child;
}
async function waitForDatabase() {
  const url = new URL(rawUrl), port = Number(url.port || 5432), deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const ready = await new Promise((resolveReady) => {
      const socket = createConnection({ host: url.hostname, port });
      socket.once("connect", () => { socket.destroy(); resolveReady(true); });
      socket.once("error", () => { socket.destroy(); resolveReady(false); });
    });
    if (ready) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("Postgres local no respondió a tiempo");
}
async function waitFor(url, child, name) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${name} terminó antes de responder`);
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1500) }); if (response.ok) return; } catch { /* servidor aún iniciando */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`${name} no respondió a tiempo`);
}
function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolveExit) => {
    const onExit = () => { clearTimeout(timer); resolveExit(true); };
    const timer = setTimeout(() => { child.off("exit", onExit); resolveExit(false); }, timeoutMs);
    child.once("exit", onExit);
  });
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = waitForExit(child, 5000);
  child.kill("SIGTERM");
  if (!(await exited)) {
    const forced = waitForExit(child, 5000);
    child.kill("SIGKILL");
    await forced;
  }
}

try {
  await waitForDatabase();
  await run("npm", ["run", "prisma:deploy", "-w", "apps/api"], { env: base });
  await run("npm", ["run", "qa:seed"], { env: base });
  await run("npm", ["run", "build", "-w", "apps/api"], { env: base });
  await run("npm", ["run", "build", "-w", "apps/web"], { env: { ...base, VITE_API_URL: apiUrl } });
  apiServer = start(["dist/server.js"], resolve("apps/api"), base, apiLog);
  await waitFor(`${apiUrl}/health`, apiServer, "API");
  webServer = start([resolve("node_modules/vite/bin/vite.js"), "preview", "--host", "localhost", "--port", "4373"], resolve("apps/web"), base);
  await waitFor(webUrl, webServer, "web");
  await run("npm", ["run", "e2e"], { env: base });
} catch (error) {
  globalThis.console.error(`e2e:ci falló: ${error.message}`);
  process.exitCode = 1;
} finally {
  await stop(webServer);
  await stop(apiServer);
  apiLog.end();
  await finished(apiLog);
}
