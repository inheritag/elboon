import postgres from 'postgres';
import { config } from './config';

// One connection pool per server process, created lazily on first use so
// that importing this module never requires the database to be reachable.
let sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql {
  if (!sql) {
    sql = postgres(config.databaseUrl());
  }
  return sql;
}

/**
 * postgres.js's `sql.json()` wants a type with an index signature, which our
 * domain types (ShippingAddress, OrderItem[]) don't have. This is a TS
 * typing gap, not a real risk. The value is already plain, serialisable data.
 */
export function toJsonValue<T>(value: T): postgres.JSONValue {
  return value as unknown as postgres.JSONValue;
}
