import { db, closeDatabase } from './index';
import { mizzapUsers } from './schema';
import { sql } from 'drizzle-orm';

/**
 * Test database connection
 * Run with: npx ts-node src/db/test-connection.ts
 */
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Simple query
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Database connection successful!');
    console.log('📅 Server time:', result[0]);

    // Test 2: Check if mizzap_users table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mizzap_users'
      )
    `);
    console.log('✅ mizzap_users table exists:', tableCheck[0].exists);

    // Test 3: Count users
    const users = await db.select().from(mizzapUsers);
    console.log('👥 Total users in database:', users.length);

    console.log('\n🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testConnection();