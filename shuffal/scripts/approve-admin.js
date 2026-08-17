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

async function approveAdmin() {
  try {
    console.log('🔍 Fetching pending admin accounts...\n');

    // Get all pending admin users
    const { data: pendingAdmins, error: fetchError } = await supabase
      .from('users')
      .select('id, cse_id, name, email, role, created_at')
      .eq('role', 'admin')
      .eq('is_verified', false);

    if (fetchError) {
      console.error('❌ Error fetching admin users:', fetchError.message);
      process.exit(1);
    }

    if (!pendingAdmins || pendingAdmins.length === 0) {
      console.log('✅ No pending admin accounts found.\n');
      console.log('Checking all pending accounts...\n');
      
      // Show all pending users
      const { data: allPending } = await supabase
        .from('users')
        .select('id, cse_id, name, email, role, is_verified, created_at')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (allPending && allPending.length > 0) {
        console.log('📋 Pending Users:');
        allPending.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.cse_id})`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Role: ${user.role}`);
          console.log(`     Created: ${new Date(user.created_at).toLocaleString()}\n`);
        });
      } else {
        console.log('✅ No pending users at all!\n');
      }
      return;
    }

    console.log('📋 Pending Admin Accounts Found:\n');
    pendingAdmins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.name} (${admin.cse_id})`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Created: ${new Date(admin.created_at).toLocaleString()}\n`);
    });

    // Approve all pending admin accounts
    console.log('🔐 Approving admin accounts...\n');

    for (const admin of pendingAdmins) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: admin.id, // Self-verified as first admin
        })
        .eq('id', admin.id);

      if (updateError) {
        console.error(`❌ Error approving ${admin.name}:`, updateError.message);
      } else {
        console.log(`✅ Approved: ${admin.name} (${admin.email})`);
        console.log(`   CSE ID: ${admin.cse_id}`);
        console.log(`   Role: admin\n`);
      }
    }

    console.log('🎉 Admin approval complete!\n');
    console.log('📝 Admin accounts can now login with their credentials:\n');
    
    pendingAdmins.forEach((admin) => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   CSE ID: ${admin.cse_id}\n`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

approveAdmin();
