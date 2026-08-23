#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const testUsers = [
  {
    cse_id: '23F2601',
    password: 'cse@iert.ac.in',
    name: 'Admin User',
    email: 'adm,in@csesociety.com',
    role: 'admin',
    year: 0,
  },
  {
    cse_id: '23F2602',
    password: 'user123',
    name: 'Member User',
    email: 'member@csesociety.com',
    role: 'member',
    year: 1,
  },
  {
    cse_id: '23F2603',
    password: 'exec123',
    name: 'Executive User',
    email: 'executive@csesociety.com',
    role: 'executive',
    year: 2,
  },
];

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database...\n');

    // Check if table exists by trying to query it
    console.log('📋 Checking if users table exists...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('📝 Users table does not exist. Creating...');
      // Table doesn't exist, we need to create it manually
      console.log('⚠️  Cannot create table via SDK. Please run this SQL in Supabase dashboard:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cse_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'executive', 'secretary', 'treasurer', 'yearRep', 'faculty')),
  department VARCHAR(100) DEFAULT 'CSE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_cse_id ON users(cse_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
      process.exit(1);
    }

    if (checkError) {
      throw checkError;
    }

    console.log('✅ Users table exists!\n');

    // Hash passwords and prepare user data
    console.log('🔐 Hashing passwords...');
    const usersToInsert = await Promise.all(
      testUsers.map(async (user) => ({
        cse_id: user.cse_id,
        name: user.name,
        email: user.email,
        year: user.year,
        password_hash: await bcrypt.hash(user.password, 10),
        role: user.role,
        department: 'CSE',
      }))
    );

    // Insert users
    console.log('👥 Inserting test users...');
    const { data, error } = await supabase
      .from('users')
      .upsert(usersToInsert, { onConflict: 'cse_id' })
      .select();

    if (error) {
      if (error.message.includes('duplicate key')) {
        console.log('⚠️  Test users already exist in database');
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Successfully created ${data?.length || 0} users\n`);
    }

    // Print login credentials
    console.log('🎉 Setup complete! Test login credentials:\n');
    testUsers.forEach((user) => {
      console.log(`✓ CSE ID: ${user.cse_id} | Password: ${user.password}`);
    });

    console.log('\n🚀 You can now login at http://localhost:3000/login');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
