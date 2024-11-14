import { parseEnv } from "znv";
import { z } from "zod";

export const {
  PORT,
  LEVEL,
} = parseEnv(process.env, {
  PORT: z.number().int().positive().optional().default(5000),
  LEVEL: z.string().min(1).optional(),
});
