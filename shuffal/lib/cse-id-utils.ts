import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Map current year (1-4) to letter (F/S/T/R)
const yearToLetter: Record<string, string> = {
  '1': 'F',
  '2': 'S',
  '3': 'T',
  '4': 'R',
};

// Membership session year (fixed at 26 for 2026-27)
const MEMBERSHIP_SESSION = '26';

/**
 * Generate CSE Society ID in format: YY + Y + SS + NN
 * Example: 23F2601
 * YY = Admission Year (last 2 digits)
 * Y = Current Year (F/S/T/R)
 * SS = Membership Session (26)
 * NN = Sequential Number (01-99)
 */
export async function generateCSEId(
  admissionYear: string,
  currentYear: string
): Promise<string> {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get last 2 digits of admission year
  const yy = admissionYear.slice(-2);

  // Get year letter
  const y = yearToLetter[currentYear];
  if (!y) {
    throw new Error('Invalid current year');
  }

  // Create the ID prefix (YY + Y + SS)
  const idPrefix = `${yy}${y}${MEMBERSHIP_SESSION}`;

  // Find the latest sequence number for this prefix
  const { data: existingUsers, error } = await supabase
    .from('users')
    .select('cse_id')
    .filter('cse_id', 'like', `${idPrefix}%`)
    .order('cse_id', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to generate CSE ID: ${error.message}`);
  }

  let nextSequence = 1;

  if (existingUsers && existingUsers.length > 0) {
    const lastId = existingUsers[0].cse_id;
    // Extract the last 2 digits (sequence number)
    const lastSequenceStr = lastId.slice(-2);
    const lastSequence = parseInt(lastSequenceStr, 10);
    nextSequence = lastSequence + 1;

    if (nextSequence > 99) {
      throw new Error('Registration limit reached for this category');
    }
  }

  // Format sequence number with leading zero
  const nn = String(nextSequence).padStart(2, '0');

  return `${idPrefix}${nn}`;
}
