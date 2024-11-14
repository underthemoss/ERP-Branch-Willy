import { parseEnv } from "znv";
import { z } from "zod";

export const {
  PORT,
  LEVEL,
} = parseEnv(process.env, {
  PORT: z.number().int().positive().optional(),
  LEVEL: z.string().min(1).optional(),
});
