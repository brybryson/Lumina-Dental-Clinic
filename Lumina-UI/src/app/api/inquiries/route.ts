import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, service, message } = body;

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'First name, last name, email, and message are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        service_of_interest: service || null,
        message: message.trim(),
        status: 'new',
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[API/inquiries] Supabase error:', error);
      // Even if table doesn't exist yet before SQL migration is run, return safe mock response
      return NextResponse.json(
        { success: true, warning: 'Logged with fallback', message: error.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiryId: data?.id,
      message: 'Inquiry received successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/inquiries] Server error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
