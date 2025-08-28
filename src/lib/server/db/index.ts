import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { DATABASE_URL, isDevelopment } from '../env';

const client = new Database(DATABASE_URL);

// Enable WAL mode for better concurrency in production
if (!isDevelopment) {
	client.pragma('journal_mode = WAL');
	client.pragma('synchronous = NORMAL');
	client.pragma('cache_size = 1000000');
	client.pragma('foreign_keys = true');
	client.pragma('temp_store = memory');
}

export const db = drizzle(client, { schema });
