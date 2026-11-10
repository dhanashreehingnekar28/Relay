import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const address = process.env.RELAY_TEST_URL || "http://127.0.0.1:5173";
export default defineConfig({
  testDir: "tests",
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: address,
    headless: true,
    channel: process.platform === "win32" ? "msedge" : undefined,
    launchOptions:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      existsSync("/usr/bin/chromium")
        ? {
            executablePath:
              process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
              "/usr/bin/chromium",
            args: ["--no-sandbox", "--no-zygote", "--disable-gpu"],
          }
        : {},
  },
  webServer: process.env.RELAY_TEST_URL
    ? undefined
    : { command: "node scripts/test-server.js", url: address, timeout: 60000 },
});
