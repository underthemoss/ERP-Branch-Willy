import dotenv from "dotenv";
dotenv.config();
import { Documentation, createConfig } from "express-zod-api";
import ui from "swagger-ui-express";
import express from "express";
import { createServer } from "express-zod-api";
import Router from "./routes";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createClient } from "@hey-api/openapi-ts";
import openapiConfig from "../openapi-ts.config";
import { LEVEL, PORT } from "./env/env";
import { startup } from "./startup";

startup().then(async () => {
  const config = createConfig({
    server: {
      compression: true,
      listen: PORT,
      beforeRouting: async ({ app, logger, getChildLogger }) => {
        app.use(
          cors({
            origin: [
              "http://localhost:3000",
              "https://staging-api.equipmentshare.com/",
              "https://api.equipmentshare.com/",
            ],
          })
        );
        const docs = new Documentation({
          routing: Router, // the same routing and config that you use to start the server
          config,
          version: "1.0",
          title: "ES-ERP API",
          serverUrl: `http://localhost:${PORT}`,
          composition: "inline", // optional, or "components" for keeping schemas in a separate dedicated section using refs
        });
        app.use("/docs", ui.serve, ui.setup(docs.rootDoc));

        if (!LEVEL) {
          // codegen
          const yaml = docs.getSpecAsYaml();
          fs.writeFileSync("./openapi.yaml", yaml);
          await createClient(openapiConfig);
        }

        app.use(
          "/es-erp",
          express.static(path.join(__dirname, "public", "build"), {
            redirect: false,
            index: "index.html",
          })
        );
        app.use(
          "/",
          express.static(path.join(__dirname, "public", "build"), {
            redirect: false,
            index: "index.html",
          })
        );
      },
    },
    cors: true,
    logger: { level: "info", color: true },
    startupLogo: false,
  });

  await createServer(config, Router);
  console.log(`🚀 Listing on port ${PORT}`);
});
