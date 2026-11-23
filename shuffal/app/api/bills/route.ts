import { NextResponse } from 'next/server';
import { createBillsSupabase, hasBillsAccess, isBillsRequesterMember } from '@/lib/bills-access';

export async function GET(request: Request) {
  try {
    if (await isBillsRequesterMember(request)) {
      return NextResponse.json({ error: 'Society members cannot view bills.' }, { status: 403 });
    }
    if (!hasBillsAccess(request)) {
      return NextResponse.json({ error: 'Password verification is required.' }, { status: 401 });
    }

    const supabase = createBillsSupabase();
    const { data, error } = await supabase
      .from('finance_entries')
      .select('id, title, amount, event_name, entry_date, details, bill_link')
      .eq('entry_type', 'expense')
      .eq('approval_status', 'approved')
      .not('bill_link', 'is', null)
      .order('entry_date', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ bills: data || [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Bills list error:', error);
    return NextResponse.json({ error: 'Could not load bills.' }, { status: 500 });
  }
}
