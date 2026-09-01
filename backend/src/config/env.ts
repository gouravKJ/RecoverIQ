import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

import { z } from 'zod';

const absDbPath = resolve(__dirname, '../../prisma/dev.db').replace(/\\/g, '/');
const defaultDbPath = `file:${absDbPath}`;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default(defaultDbPath),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  EXECUTOR_MODE: z.enum(['demo', 'razorpay', 'hybrid']).default('hybrid'),
  DEMO_FORCE_SCENARIO_OUTCOMES: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  WEBHOOK_STALE_EVENT_SECONDS: z.coerce.number().default(300),
  LOG_LEVEL: z.string().default('info'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
  LLM_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  LLM_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = envSchema.safeParse({
  ...process.env,
  DATABASE_URL: defaultDbPath,
});

export const env = parsed.success
  ? parsed.data
  : ({
      NODE_ENV: 'test',
      PORT: 4000,
      DATABASE_URL: defaultDbPath,
      EXECUTOR_MODE: 'demo' as const,
      DEMO_FORCE_SCENARIO_OUTCOMES: true,
      WEBHOOK_STALE_EVENT_SECONDS: 300,
      LOG_LEVEL: 'info',
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      LLM_ENABLED: process.env.LLM_ENABLED === 'true',
      LLM_TIMEOUT_MS: 15000,
    } as z.infer<typeof envSchema>);
