import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import * as schema from './schema';

/**
 * PostgreSQL connection client
 * Uses connection pooling for better performance
 */
const connectionString = config.database.url;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

/**
 * Create postgres client with connection pooling
 */
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

/**
 * Drizzle ORM database instance
 * Provides type-safe database operations
 */
export const db = drizzle(client, { schema });

/**
 * Close database connection
 * Call this when shutting down the server
 */
export const closeDatabase = async (): Promise<void> => {
  await client.end();
};

/**
 * Export schema for use in other files
 */
export { schema };