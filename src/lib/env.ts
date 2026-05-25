import { z } from "zod";

const fallbackDatabaseUrl =
  "postgresql://telemedi:telemedi@localhost:5432/telemedi?schema=public";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).default(fallbackDatabaseUrl),
  DIRECT_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("telemedi-local-dev-secret-change-before-production"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  TELEMEDI_DEMO_SEED: z.string().default("true"),
  TELEMEDI_ADMIN_EMAIL: z.email().default("admin@telemedi.pl"),
  TELEMEDI_ADMIN_PASSWORD: z.string().min(8).default("TelemediDemo123!"),
  TELEMEDI_COORDINATOR_EMAIL: z.email().default("koordynator@demo.pl"),
  TELEMEDI_COORDINATOR_PASSWORD: z.string().min(8).default("TelemediDemo123!"),
  TELEMEDI_HR_EMAIL: z.email().default("hr@demo.pl"),
  TELEMEDI_HR_PASSWORD: z.string().min(8).default("TelemediDemo123!"),
});

const parsedEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TELEMEDI_DEMO_SEED: process.env.TELEMEDI_DEMO_SEED,
  TELEMEDI_ADMIN_EMAIL: process.env.TELEMEDI_ADMIN_EMAIL,
  TELEMEDI_ADMIN_PASSWORD: process.env.TELEMEDI_ADMIN_PASSWORD,
  TELEMEDI_COORDINATOR_EMAIL: process.env.TELEMEDI_COORDINATOR_EMAIL,
  TELEMEDI_COORDINATOR_PASSWORD: process.env.TELEMEDI_COORDINATOR_PASSWORD,
  TELEMEDI_HR_EMAIL: process.env.TELEMEDI_HR_EMAIL,
  TELEMEDI_HR_PASSWORD: process.env.TELEMEDI_HR_PASSWORD,
});

export const env = {
  ...parsedEnv,
  DIRECT_URL: parsedEnv.DIRECT_URL ?? parsedEnv.DATABASE_URL,
  DEMO_SEED_ENABLED: parsedEnv.TELEMEDI_DEMO_SEED !== "false",
};

export function missingProductionEnv(): string[] {
  if (process.env.NODE_ENV !== "production") {
    return [];
  }

  return [
    "DATABASE_URL",
    "DIRECT_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
  ].filter((key) => !process.env[key]);
}
