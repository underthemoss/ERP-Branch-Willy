import { parseEnv } from "znv";
import { z } from "zod";

export const { PORT, LEVEL, MONGO_CONNECTION_STRING } = parseEnv(process.env, {
  PORT: z.number().int().positive().optional().default(5000),
  LEVEL: z.string().min(1).optional(),
  MONGO_CONNECTION_STRING: z.string().min(1).optional(),
});
