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

let isReady = false;
const port = PORT || 5000;
const config = createConfig({
  server: {
    listen: port,
  },
  cors: true,
  logger: { level: "info", color: true },
  startupLogo: false,
});

config.server.beforeRouting = ({ app, logger, getChildLogger }) => {
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
    serverUrl: "http://localhost:5000",
    composition: "inline", // optional, or "components" for keeping schemas in a separate dedicated section using refs
  });
  app.use("/docs", ui.serve, ui.setup(docs.rootDoc));

  if (!LEVEL) {
    const yaml = docs.getSpecAsYaml();
    fs.writeFileSync("./openapi.yaml", yaml);
    createClient(openapiConfig);
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
};
createServer(config, Router);

startup().then(() => {
  isReady = true;
});
