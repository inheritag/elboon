import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { config } from './config';

// One connection pool per server process, created lazily on first use so
// that importing this module never requires the database to be reachable.
let sql: postgres.Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): postgres.Sql {
  if (!sql) {
    sql = postgres(config.databaseUrl(), {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      // Neon’s pooler (pgbouncer) does not support named prepared statements.
      prepare: false
    });
  }
  return sql;
}

export async function readyDb(): Promise<postgres.Sql> {
  const client = getDb();
  if (!schemaReady) {
    schemaReady = applySchema(client);
  }
  await schemaReady;
  return client;
}

async function applySchema(client: postgres.Sql): Promise<void> {
  const path = resolve('db/schema.sql');
  const text = readFileSync(path, 'utf8');
  const withoutComments = text
    .split('\n')
    .map((line) => {
      const cut = line.indexOf('--');
      return cut === -1 ? line : line.slice(0, cut);
    })
    .join('\n');
  const statements = withoutComments
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  for (const statement of statements) {
    await client.unsafe(statement);
  }
}

/**
 * postgres.js's `sql.json()` wants a type with an index signature, which our
 * domain types (ShippingAddress, OrderItem[]) don't have. This is a TS
 * typing gap, not a real risk. The value is already plain, serialisable data.
 */
export function toJsonValue<T>(value: T): postgres.JSONValue {
  return value as unknown as postgres.JSONValue;
}
