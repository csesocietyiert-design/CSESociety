const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Direct student data from the form
const studentData = {
  firstName: 'Kartikey',
  lastName: 'Singh',
  email: 'singhkartikey280@gmail.com',
  rollNumber: '2401100100028',
  admissionYear: 2024,
  currentYear: 3,
  mobileNumber: '7084229741',
  bloodGroup: 'O+',
  dateOfBirth: '29/03/2007',
  gender: 'Male',
  department: 'Computer Science & Engineering',
};

async function generateCSEId(supabase, admissionYear, currentYear) {
  try {
    // Try to get sequence from counter table
    const { data, error } = await supabase
      .from('cse_id_counter')
      .select('sequence_num')
      .eq('year', admissionYear)
      .single();

    if (!error && data) {
      const seqNum = (data.sequence_num + 1).toString().padStart(3, '0');
      const yy = admissionYear.toString().slice(-2);
      const y = currentYear;
      const sessionNum = '26';

      const cseId = `${yy}${y}${sessionNum}${seqNum}`;

      // Update counter
      await supabase
        .from('cse_id_counter')
        .update({ sequence_num: data.sequence_num + 1 })
        .eq('year', admissionYear);

      return cseId;
    }
  } catch (err) {
    console.log('⚠️  Counter table not found, using simple sequence...');
  }

  // Fallback: Generate simple CSE ID without counter
  const yy = admissionYear.toString().slice(-2);
  const y = currentYear;
  const sessionNum = '26';
  const seqNum = '001'; // Simple default
  
  return `${yy}${y}${sessionNum}${seqNum}`;
}

async function importStudent() {
  try {
    console.log('🚀 Starting student import...\n');

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('❌ Supabase environment variables not configured');
      console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const fullName = `${studentData.firstName} ${studentData.lastName}`.trim();
    
    // Generate default password based on roll number
    const defaultPassword = studentData.rollNumber;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Generate CSE ID
    const cseId = await generateCSEId(supabase, studentData.admissionYear, studentData.currentYear);

    console.log('📝 Student Information:');
    console.log(`   Name: ${fullName}`);
    console.log(`   Email: ${studentData.email}`);
    console.log(`   Roll Number: ${studentData.rollNumber}`);
    console.log(`   Admission Year: ${studentData.admissionYear}`);
    console.log(`   Current Year: ${studentData.currentYear}`);
    console.log(`   Mobile: ${studentData.mobileNumber}`);
    console.log(`   Blood Group: ${studentData.bloodGroup}`);
    console.log(`   Department: ${studentData.department}\n`);

    console.log('🔐 Generated Credentials:');
    console.log(`   Generated CSE ID: ${cseId}`);
    console.log(`   Default Password: ${defaultPassword}`);
    console.log(`   Password Hash: ${passwordHash.substring(0, 20)}...\n`);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentData.email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('⚠️  Student with this email already exists in database');
      console.log(`   Email: ${studentData.email}`);
      return;
    }

    // Insert student
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          cse_id: cseId,
          name: fullName,
          email: studentData.email.toLowerCase(),
          year: studentData.currentYear,
          password_hash: passwordHash,
          role: 'member',
          department: studentData.department.trim() || 'CSE',
          admission_year: studentData.admissionYear,
          is_verified: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(`❌ Error adding student: ${error.message}`);
      console.log(error);
    } else {
      console.log('✅ Student successfully added to database!\n');
      console.log('📊 Database Record:');
      console.log(`   ID: ${data.id}`);
      console.log(`   CSE ID: ${data.cse_id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Year: ${data.year}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Verified: ${data.is_verified}`);
      console.log(`   Created: ${data.created_at}\n`);
      
      console.log('🎓 Login Credentials:');
      console.log(`   CSE ID/Email: ${data.email}`);
      console.log(`   Password: ${defaultPassword}\n`);
      
      console.log('✨ Import completed successfully!');
    }
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  }
}

importStudent().catch(console.error);
