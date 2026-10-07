// Drives one headless Chrome over the DevTools protocol (Node's built-in WebSocket),
// so a whole package renders in a single browser session.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startBrowser() {
  const profile = mkdtempSync(path.join(os.tmpdir(), "oscare-render-"));
  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1400,2100",
      `--user-data-dir=${profile}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const wsUrl = await new Promise((resolve, reject) => {
    let log = "";
    const timer = setTimeout(() => reject(new Error("Chrome nie wystartował:\n" + log)), 20000);
    proc.stderr.on("data", (chunk) => {
      log += chunk;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on("exit", () => reject(new Error("Chrome się zamknął:\n" + log)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const call = pending.get(msg.id);
    if (!call) return;
    pending.delete(msg.id);
    if (msg.error) call.reject(new Error(msg.error.message));
    else call.resolve(msg.result);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page("Page.enable");

  return {
    /** Renders an HTML file to a w×h PNG once the template reports document.title === "ready". */
    async shoot(htmlFile, pngFile, w, h) {
      const url = pathToFileURL(htmlFile).href;
      await page("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await page("Page.navigate", { url });
      const started = Date.now();
      for (;;) {
        const { result } = await page("Runtime.evaluate", {
          expression: `location.href === ${JSON.stringify(url)} && document.title === "ready"`,
          returnByValue: true,
        });
        if (result.value) break;
        if (Date.now() - started > 20000) throw new Error(`Szablon się nie wyrenderował: ${htmlFile}`);
        await sleep(40);
      }
      const { data } = await page("Page.captureScreenshot", {
        format: "png",
        clip: { x: 0, y: 0, width: w, height: h, scale: 1 },
      });
      writeFileSync(pngFile, Buffer.from(data, "base64"));
    },
    async close() {
      const exited = new Promise((resolve) => {
        proc.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
      await send("Browser.close").catch(() => {});
      ws.close();
      await exited;
      proc.kill();
      // Chrome may still be flushing its profile; a leftover temp folder is harmless.
      try {
        rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch {}
    },
  };
}
