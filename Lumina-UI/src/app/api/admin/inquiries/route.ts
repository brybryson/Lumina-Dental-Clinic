import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all inquiries with source and status filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let query = supabaseAdmin
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API/admin/inquiries] Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiries: data || [] });
  } catch (err: unknown) {
    console.error('[API/admin/inquiries] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH: Update inquiry status (e.g. replied, converted, archived)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { inquiryId, status } = body;

    if (!inquiryId || !status) {
      return NextResponse.json(
        { error: 'inquiryId and status are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .update({ status })
      .eq('id', inquiryId)
      .select()
      .single();

    if (error) {
      console.error('[API/admin/inquiries] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiry: data });
  } catch (err: unknown) {
    console.error('[API/admin/inquiries] PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
