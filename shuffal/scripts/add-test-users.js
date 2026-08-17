const bcrypt = require('bcryptjs');

const testUsers = [
  {
    cseId: '23F2601',
    password: 'KuchBhi',
    name: 'Admin User',
    email: 'admin@csesociety.com',
    role: 'admin',
    year: 1,
  },
  {
    cseId: '23F2602',
    password: 'user123',
    name: 'Member User',
    email: 'member@csesociety.com',
    role: 'member',
    year: 1,
  },
  {
    cseId: '23F2603',
    password: 'exec123',
    name: 'Executive User',
    email: 'executive@csesociety.com',
    role: 'executive',
    year: 2,
  },
];

async function generateHashes() {
  console.log('Test Users with Hashed Passwords:\n');
  
  for (const user of testUsers) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`CSE ID: ${user.cseId}`);
    console.log(`Password: ${user.password}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Year: ${user.year}`);
    console.log(`Hash: ${hash}`);
    console.log('---');
    console.log(`SQL for Supabase:\n`);
    console.log(`INSERT INTO users (cse_id, password_hash, name, email, role, year, department) VALUES ('${user.cseId}', '${hash}', '${user.name}', '${user.email}', '${user.role}', ${user.year}, 'CSE');\n`);
    console.log('---\n');
  }
}

generateHashes().catch(console.error);
