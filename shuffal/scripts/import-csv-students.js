const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// CSV parser helper
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return [];
  }
  
  // Split headers carefully, handling quoted fields
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Parse CSV line handling quoted values
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    let hasValidData = false;
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
      if (idx < 3 && values[idx] && values[idx].trim()) {
        hasValidData = true;
      }
    });
    
    if (hasValidData) {
      rows.push(row);
    }
  }
  
  return rows;
}

// Generate CSE ID from admission year and current year
async function generateCSEId(supabase, admissionYear, currentYear) {
  const { data, error } = await supabase
    .from('cse_id_counter')
    .select('sequence_num')
    .eq('year', admissionYear)
    .single();

  if (error) {
    throw new Error(`Failed to get sequence: ${error.message}`);
  }

  const seqNum = (data.sequence_num + 1).toString().padStart(3, '0');
  const yy = admissionYear.toString().slice(-2);
  const y = currentYear;
  const sessionNum = '26'; // Fixed for 2026-27

  const cseId = `${yy}${y}${sessionNum}${seqNum}`;

  // Update counter
  await supabase
    .from('cse_id_counter')
    .update({ sequence_num: data.sequence_num + 1 })
    .eq('year', admissionYear);

  return cseId;
}

async function importStudents() {
  try {
    const csvPath = path.join(__dirname, '../temp-students.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found at:', csvPath);
      console.log('Please save the CSV file as temp-students.csv in the shuffal directory');
      return;
    }

    console.log('📖 Reading CSV file...');
    const students = parseCSV(csvPath);
    console.log(`✅ Found ${students.length} student(s)\n`);

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('❌ Supabase environment variables not configured');
      console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    for (const student of students) {
      try {
        const firstName = student['First Name '] || '';
        const lastName = student['  Last Name  '] || '';
        const email = student['Email address'] || student['Email Address'] || '';
        const rollNumber = student['Roll Number ( AKTU)'] || '';
        const admissionYear = parseInt(student['Admission Year '] || '2024', 10);
        const currentYearStr = student['  Current Year  '] || '';
        const currentYear = currentYearStr.includes('1st') ? 1 : 
                            currentYearStr.includes('2nd') ? 2 :
                            currentYearStr.includes('3rd') ? 3 :
                            currentYearStr.includes('4th') ? 4 : 3;
        const department = student['Branch / Department '] || 'CSE';
        const mobileNumber = student['Mobile Number  '] || '';
        const bloodGroup = student['  Blood Group  '] || '';
        const dateOfBirth = student['  Date of Birth  '] || '';
        const gender = student['Gender  '] || '';

        // Validate required fields
        if (!firstName.trim() || !email.trim()) {
          console.log(`⚠️  Skipping incomplete entry: ${firstName} ${lastName}`);
          continue;
        }

        const fullName = `${firstName} ${lastName}`.trim();
        
        // Generate default password based on roll number or email
        const defaultPassword = rollNumber || email.split('@')[0];
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Generate CSE ID
        const cseId = await generateCSEId(supabase, admissionYear, currentYear);

        // Insert student
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              cse_id: cseId,
              name: fullName,
              email: email.toLowerCase(),
              year: currentYear,
              password_hash: passwordHash,
              role: 'member',
              department: department.trim() || 'CSE',
              admission_year: admissionYear,
              mobile_number: mobileNumber,
              blood_group: bloodGroup,
              date_of_birth: dateOfBirth,
              gender: gender,
              roll_number: rollNumber,
              is_verified: false,
            },
          ])
          .select()
          .single();

        if (error) {
          console.log(`❌ Error adding ${fullName}:`, error.message);
        } else {
          console.log(`✅ Added: ${fullName}`);
          console.log(`   📧 Email: ${email}`);
          console.log(`   🆔 CSE ID: ${cseId}`);
          console.log(`   📱 Mobile: ${mobileNumber}`);
          console.log(`   📊 Year: ${currentYear}`);
          console.log('   🔑 Default Password:', defaultPassword);
          console.log('');
        }
      } catch (err) {
        console.log(`❌ Error processing student:`, err.message);
      }
    }

    console.log('✅ Import complete!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

importStudents().catch(console.error);
