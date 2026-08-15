#!/usr/bin/env node

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
const projectRef = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : '';

console.log('⚠️  DELETE ALL USERS - Database Clear Script');
console.log('==============================================\n');
console.log('This will DELETE ALL user data from your database.\n');
console.log('To proceed, go to your Supabase dashboard:\n');
console.log(`📍 https://supabase.com/dashboard/project/${projectRef}/sql\n`);
console.log('Click "New Query" and run this SQL:\n');

const deleteSQL = `-- ⚠️  WARNING: This will delete ALL users!
DELETE FROM users;

-- Reset the sequence counter (if needed)
DELETE FROM cse_id_counter;
INSERT INTO cse_id_counter (year, session_num, sequence_num) VALUES 
  (2023, 1, 0),
  (2024, 1, 0),
  (2025, 1, 0),
  (2026, 1, 0)
ON CONFLICT (year) DO UPDATE SET sequence_num = 0;`;

console.log(deleteSQL);
console.log('\n✂️  After running this SQL, all users will be deleted.');
console.log('✅ You can then register new users with fresh CSE IDs.\n');
