import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

const sqlite = new Database(`${process.env.SQLITE_FILE}`);

const db = drizzle(sqlite);

export default db;
