import { Pool } from "pg";

/* One pool per server process; DATABASE_URL points at any Postgres (Railway in production). */
const g = globalThis as unknown as { pool?: Pool; ready?: Promise<unknown> };

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  g.pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3, // serverless: keep per-instance connections low
    // Railway's public proxy URL needs TLS; its private network and local Postgres don't
    ssl: /\.proxy\.rlwy\.net|sslmode=require/.test(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
  });
  g.ready ??= g.pool
    .query(
      `create table if not exists stores (
         slug text primary key,
         data jsonb not null,
         token_hash text not null,
         updated_at timestamptz not null default now()
       )`
    )
    .catch((e) => {
      g.ready = undefined;
      throw e;
    });
  return g.ready.then(() => g.pool!);
}
