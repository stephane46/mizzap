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
  schemaFilter: ['mizzap'], // Use dedicated mizzap schema, NOT public
  verbose: true,
  strict: false,
} satisfies Config;