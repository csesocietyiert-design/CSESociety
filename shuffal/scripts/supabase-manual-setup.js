#!/usr/bin/env node

const https = require('https');
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const url = new URL(`${supabaseUrl}/rest/v1/rpc/sql`);
const projectRef = supabaseUrl.split('.')[0].split('//')[1];

const createTableSQL = `
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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

console.log('📝 Creating users table via SQL...');
console.log('Database URL:', supabaseUrl);
console.log('\nTo complete setup manually, go to:');
console.log(`https://supabase.com/dashboard/project/${projectRef}/sql`);
console.log('\nPaste and run this SQL:\n');
console.log(createTableSQL);
console.log('\n\nThen add test users with this SQL:\n');
console.log(`
INSERT INTO users (cse_id, password_hash, name, email, role, year, department) VALUES 
  ('23F2601', '$2b$10$E0qo0tRlf0mghtTteEPjR.HlQBr6PT83oZTSAhZGTDCRU1A2Mtmym', 'Admin User', 'admin@csesociety.com', 'admin', 1, 'CSE'),
  ('23F2602', '$2b$10$.twgqZq8AmEzi8xGmQjuxuVBSCDkRD6dIkXo09vZ2D91uf2OFaN7e', 'Member User', 'member@csesociety.com', 'member', 1, 'CSE'),
  ('23F2603', '$2b$10$xl6tlgF7Zv1ekgv9eeFgU.gMWZCr0ssTHXBGdkbHznQXv12rAv1e6', 'Executive User', 'executive@csesociety.com', 'executive', 2, 'CSE');
`);
