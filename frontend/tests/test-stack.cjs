const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn, execFileSync } = require("node:child_process");

function reservePort() {
  // Windows can allocate low ephemeral ports blocked by Chromium (e.g. 1723).
  // Use an OS-checked high port; collisions retry without weakening any UI assertion.
  return new Promise((resolve, reject) => { const socket = net.createServer(); socket.once("error", error => error.code === 'EADDRINUSE' ? reservePort().then(resolve,reject) : reject(error)); socket.listen(crypto.randomInt(20000,60000), "127.0.0.1", () => { const port = socket.address().port; socket.close(() => resolve(port)); }); });
}

async function startStack(frontend, { emailDelivery = true, demo = false, oauth = false } = {}) {
  const backendDir = path.resolve(frontend, "../backend");
  const [frontPort, apiPort] = await Promise.all([reservePort(), reservePort()]);
  const base = `http://127.0.0.1:${frontPort}`;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "kaushaliq-auth-test-"));
  const demoPassword = crypto.randomBytes(24).toString('base64url') + 'Aa9!';
  const isolatedEnv = { ...process.env, EMAIL_PROVIDER: "", EMAIL_API_KEY: "", EMAIL_FROM: "", SMS_PROVIDER: "", SMS_API_KEY: "", SMS_SENDER_ID: "", ENVIRONMENT: "development", FRONTEND_URL: base, AUTH_SESSION_TTL: "8h", JWT_SECRET: "test-secret-with-more-than-32-characters", AUTH_DATABASE_PATH: path.join(temporary, "auth.sqlite3"), AUTH_COOKIE_SAMESITE: "lax" , DEMO_ACCOUNT_ENABLED: demo ? 'true' : 'false', DEMO_ACCOUNT_EMAIL:'demo@kaushaliq.local', DEMO_ACCOUNT_PASSWORD: demo ? demoPassword : '' };
  // Tests must never inherit real local provider credentials or call a live OAuth provider.
  Object.assign(isolatedEnv, { API_URL: `http://127.0.0.1:${apiPort}`, GOOGLE_CLIENT_ID:'', GOOGLE_CLIENT_SECRET:'', GOOGLE_CALLBACK_URL:'', GITHUB_CLIENT_ID:'', GITHUB_CLIENT_SECRET:'', GITHUB_CALLBACK_URL:'' });
  if (demo) execFileSync(process.env.PYTHON || 'python', ['-m','src.scripts.seed_demo_account'], { cwd:backendDir, env:isolatedEnv, stdio:'ignore', windowsHide:true });
  const backend = spawn(process.env.PYTHON || "python", oauth ? ["tests/oauth_server.py", String(apiPort)] : emailDelivery ? ["tests/provider_server.py", String(apiPort)] : ["-m", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", String(apiPort)], {
    cwd: backendDir,
    env: isolatedEnv,
    stdio: "ignore", windowsHide: true,
  });
  let front;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${apiPort}/api/health`)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  front = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(frontPort), "--strictPort"], {
    cwd: frontend, env: { ...process.env, API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` }, stdio: "ignore", windowsHide: true,
  });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  return {
    base, apiPort, demo: demo ? {email:isolatedEnv.DEMO_ACCOUNT_EMAIL,password:demoPassword} : null, database: path.join(temporary, "auth.sqlite3"), processes: [front, backend],
    async stop() {
      const children = [front, backend].filter(Boolean);
      for (const child of children) if (child.exitCode === null) child.kill();
      await Promise.all(children.map(child => new Promise(resolve => { if (child.exitCode !== null) resolve(); else { child.once("exit", resolve); setTimeout(resolve, 3000).unref(); } })));
      try { fs.rmSync(temporary, { recursive: true, force: true }); } catch {}
    },
  };
}

module.exports = { startStack };
