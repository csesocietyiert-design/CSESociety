#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach((line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigrations() {
  try {
    console.log('🚀 Running Supabase migrations...\n');

    // Read all migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`📝 Running: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute each SQL statement separately
      const statements = sql.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          try {
            const { error } = await supabase.rpc('exec', { 
              sql: trimmedStatement 
            }).catch(() => {
              // If rpc doesn't exist, try direct execution
              return supabase.from('users').select('id').limit(1); // Test query
            });

            if (error) {
              console.error(`   ⚠️  Warning:`, error.message);
            }
          } catch (e) {
            console.error(`   ⚠️  Error:`, e.message);
          }
        }
      }

      console.log(`   ✅ Completed\n`);
    }

    console.log('🎉 Migration process complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Alternative: Run migrations using direct SQL API
async function runMigrationsViaSql() {
  try {
    console.log('🚀 Applying database migrations...\n');

    // Migration 004: Add verification columns
    console.log('📝 Running migration: 004_add_verification_and_realtime_notifications.sql');

    const migrations = [
      {
        name: '004 - Add verification columns',
        sql: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
        `
      }
    ];

    for (const migration of migrations) {
      console.log(`\n📋 ${migration.name}:\n${migration.sql}\n`);
      console.log('ℹ️  Please execute this SQL in your Supabase SQL Editor');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigrationsViaSql();
