import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  // Only manage tables that start with 'mizzap_' - ignore all other tables
  schemaFilter: ['public'],
  tablesFilter: ['mizzap_*'],
  verbose: true,
  strict: false, // Don't enforce strict mode to avoid dropping other tables
} satisfies Config;