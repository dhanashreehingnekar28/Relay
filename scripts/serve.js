import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import handler from "../api/relay.js";
const root = resolve("dist");
export function serve(port = 5173) {
  const app = http.createServer(async (req, res) => {
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (path.startsWith("/api/")) {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 16000) {
            res.writeHead(413);
            res.end();
            return;
          }
        }
        req.body = body || {};
        res.status = (n) => {
          res.statusCode = n;
          return res;
        };
        res.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };
        await handler(req, res);
        return;
      }
      const file = resolve(root, "." + (path === "/" ? "/index.html" : path));
      if (!file.startsWith(root + "/")) throw Error();
      const bytes = await readFile(file);
      res.setHeader(
        "Content-Type",
        {
          ".js": "text/javascript",
          ".html": "text/html",
          ".css": "text/css",
          ".svg": "image/svg+xml",
        }[extname(file)] || "application/octet-stream",
      );
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end("Unavailable");
    }
  });
  return app.listen(port, "127.0.0.1");
}
if (process.argv[1]?.endsWith("/serve.js")) serve();
