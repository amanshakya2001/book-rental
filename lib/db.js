import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}
