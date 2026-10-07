import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function campusSavePlugin(): Plugin {
  return {
    name: "campus-save-plugin",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__campus-save", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (
              !data ||
              !Array.isArray(data.locations) ||
              !Array.isArray(data.nodes) ||
              !Array.isArray(data.edges)
            ) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Invalid campus data format. Expected { locations, nodes, edges }.",
                }),
              );
              return;
            }

            const filePath = path.resolve(process.cwd(), "src/config/campusData.json");
            const bakPath = path.resolve(process.cwd(), "src/config/campusData.json.bak");

            if (fs.existsSync(filePath)) {
              fs.copyFileSync(filePath, bakPath);
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, message: "Campus data saved successfully." }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err?.message || "Failed to save campus data" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [campusSavePlugin()],
});
