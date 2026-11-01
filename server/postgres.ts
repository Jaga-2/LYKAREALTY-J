import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool: Pool | null = null;
let isPostgresActive = false;
let connectionError: string | null = null;

export interface DatabaseStatus {
  mode: 'postgresql' | 'demo_local';
  connected: boolean;
  database?: string;
  host?: string;
  error?: string | null;
}

export function isPostgresConfigured(): boolean {
  return !!(process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGDATABASE));
}

export function getPostgresPool(): Pool | null {
  if (pool) return pool;

  if (!isPostgresConfigured()) {
    return null;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    pool = connectionString
      ? new Pool({
          connectionString,
          ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
            ? false
            : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        })
      : new Pool({
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || '5432', 10),
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
          max: 10
        });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Idle pool client error:', err.message);
    });

    return pool;
  } catch (err: any) {
    connectionError = err.message;
    console.error('[PostgreSQL] Pool initialization error:', err.message);
    return null;
  }
}

export async function initPostgresDatabase(): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) {
    isPostgresActive = false;
    return false;
  }

  let client: PoolClient | null = null;
  try {
    client = await p.connect();
    // Read-only connection verification (Zero DDL, Zero schema.sql)
    const res = await client.query('SELECT 1 AS connected;');
    if (res.rows[0]?.connected === 1) {
      console.log('[PostgreSQL] Connected successfully to production database (Zero DDL/read-only mode active).');
      isPostgresActive = true;
      connectionError = null;
      return true;
    }
    return false;
  } catch (err: any) {
    isPostgresActive = false;
    connectionError = err.message;
    console.warn('[PostgreSQL] Failed connecting to PostgreSQL:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

export function getDbStatus(): DatabaseStatus {
  if (isPostgresActive) {
    return {
      mode: 'postgresql',
      connected: true,
      database: process.env.PGDATABASE || 'PostgreSQL Enterprise',
      host: process.env.PGHOST || 'Remote PostgreSQL'
    };
  }

  return {
    mode: 'demo_local',
    connected: false,
    error: connectionError,
    database: 'Local File JSON / Demo Engine'
  };
}
