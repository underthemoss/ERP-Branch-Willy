import { Pool, ClientConfig } from "pg";

const { ESDB_HOST, ESDB_PORT, ESDB_USER, ESDB_PASSWORD } = process.env;

export const pgConfig = {
  host: ESDB_HOST!,
  port: Number(ESDB_PORT!),
  user: ESDB_USER!,
  password: ESDB_PASSWORD!,
  database: "equipmentshare",
} as ClientConfig;

export const pool = new Pool({
  ...pgConfig,
});
