import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { CircularRecord } from '@/lib/circulars';
import { getCircularAdmin, getCircularsSupabase } from '@/lib/circulars-server';

export const runtime = 'nodejs';

const maxFileSize = 4 * 1024 * 1024;
const publicHeaders = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const supabase = getCircularsSupabase();
    const { data, error } = await supabase
      .from('circulars')
      .select('id, title, description, circular_date, category, uploaded_at')
      .order('circular_date', { ascending: false })
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json(
      { circulars: (data || []) as CircularRecord[] },
      { headers: publicHeaders }
    );
  } catch (error) {
    console.error('Circular list request failed:', error);
    return NextResponse.json(
      { error: 'Could not load circulars' },
      { status: 500, headers: publicHeaders }
    );
  }
}

export async function POST(request: Request) {
  let supabase: ReturnType<typeof getCircularsSupabase> | undefined;
  let uploadedPath: string | undefined;

  try {
    supabase = getCircularsSupabase();
    const admin = await getCircularAdmin(request, supabase);
    if ('error' in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const circularDate = formData.get('circularDate');
    const category = formData.get('category');
    const description = formData.get('description');
    const acknowledged = formData.get('publicAcknowledged') === 'true';

    if (!(file instanceof File) || typeof title !== 'string' || typeof circularDate !== 'string' || typeof category !== 'string') {
      return NextResponse.json({ error: 'Enter the circular title, date, and category, and choose a PDF' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const uploadBaseName = file.name.replace(/\.pdf$/i, '').trim();
    const parsedCircularDate = /^\d{4}-\d{2}-\d{2}$/.test(circularDate)
      ? new Date(`${circularDate}T00:00:00.000Z`)
      : null;
    if (
      !cleanTitle ||
      cleanTitle.length > 150 ||
      /\.pdf$/i.test(cleanTitle) ||
      cleanTitle.toLocaleLowerCase() === uploadBaseName.toLocaleLowerCase() ||
      !cleanCategory ||
      cleanCategory.length > 80 ||
      !parsedCircularDate ||
      Number.isNaN(parsedCircularDate.getTime()) ||
      parsedCircularDate.toISOString().slice(0, 10) !== circularDate ||
      cleanDescription.length > 1000
    ) {
      return NextResponse.json(
        { error: 'Enter an official circular title (not the PDF filename), a valid date, a category up to 80 characters, and a description up to 1,000 characters' },
        { status: 400 }
      );
    }
    if (!acknowledged) {
      return NextResponse.json(
        { error: 'Confirm that this document is approved for public sharing' },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > maxFileSize || !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Choose a PDF smaller than 4 MB' }, { status: 400 });
    }
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'The uploaded file must be a PDF' }, { status: 400 });
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(fileBytes.subarray(0, 5)) !== '%PDF-') {
      return NextResponse.json({ error: 'The uploaded file is not a valid PDF' }, { status: 400 });
    }

    const id = randomUUID().replaceAll('-', '');
    uploadedPath = `${id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('society-circulars')
      .upload(uploadedPath, fileBytes, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;

    const { data, error: insertError } = await supabase
      .from('circulars')
      .insert({
        id,
        title: cleanTitle,
        circular_date: circularDate,
        category: cleanCategory,
        description: cleanDescription || null,
        file_path: uploadedPath,
        uploaded_by: admin.id,
      })
      .select('id, title, description, circular_date, category, uploaded_at')
      .single();

    if (insertError) {
      const { error: cleanupError } = await supabase.storage
        .from('society-circulars')
        .remove([uploadedPath]);
      if (cleanupError) console.error('Could not remove an unlisted circular upload:', cleanupError);
      uploadedPath = undefined;
      throw insertError;
    }

    uploadedPath = undefined;
    return NextResponse.json({ circular: data }, { status: 201, headers: publicHeaders });
  } catch (error) {
    if (supabase && uploadedPath) {
      const { error: cleanupError } = await supabase.storage
        .from('society-circulars')
        .remove([uploadedPath]);
      if (cleanupError) console.error('Could not clean up a failed circular upload:', cleanupError);
    }
    console.error('Circular upload failed:', error);
    return NextResponse.json({ error: 'Could not publish circular' }, { status: 500 });
  }
}
