import { NextResponse } from 'next/server';
import { createBillsSupabase } from '@/lib/bills-access';

export async function GET() {
  try {
    const supabase = createBillsSupabase();
    const { data, error } = await supabase
      .from('finance_entries')
      .select('id, title, amount, event_name, entry_date, details, bill_link')
      .eq('entry_type', 'expense')
      .eq('approval_status', 'approved')
      .not('bill_link', 'is', null)
      .order('entry_date', { ascending: false });
    if (error) throw error;

    const bills = await Promise.all((data || []).map(async (bill) => {
      if (!bill.bill_link?.startsWith('bills/')) return bill;
      const { data: signed, error: signedError } = await supabase.storage
        .from('society-bills')
        .createSignedUrl(bill.bill_link, 60 * 60);
      if (signedError) console.error('Could not sign public bill:', signedError);
      return { ...bill, bill_link: signed?.signedUrl || null };
    }));

    return NextResponse.json({ bills }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Bills list error:', error);
    return NextResponse.json({ error: 'Could not load bills.' }, { status: 500 });
  }
}
