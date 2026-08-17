const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const studentUpdates = [
  {
    email: 'singhkartikey280@gmail.com',
    profileImageUrl: 'https://drive.google.com/open?id=1rg6c2ozoK4TeGulu1hk8LxILayO_gVXs',
  },
];

async function updateStudentProfile() {
  try {
    console.log('🚀 Starting profile image update...\n');

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('❌ Supabase environment variables not configured');
      return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    for (const update of studentUpdates) {
      console.log(`📧 Updating: ${update.email}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ profile_image_url: update.profileImageUrl })
        .eq('email', update.email.toLowerCase())
        .select()
        .single();

      if (error) {
        console.log(`❌ Error updating ${update.email}:`, error.message);
      } else {
        console.log(`✅ Profile image URL updated successfully!`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Profile Image: ${data.profile_image_url}`);
        console.log('');
      }
    }

    console.log('✨ Update completed!');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

updateStudentProfile().catch(console.error);
