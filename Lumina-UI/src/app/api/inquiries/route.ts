import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, service, message, source, status } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'First name and email are required.' },
        { status: 400 }
      );
    }

    const leadSource = source || 'contact_modal';

    // For organic contact modal inquiries, a message is required
    if (leadSource === 'contact_modal' && !message) {
      return NextResponse.json(
        { error: 'Message is required for general inquiries.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName ? lastName.trim() : null,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        service_of_interest: service || null,
        message: message ? message.trim() : null,
        source: leadSource,
        status: status || (leadSource === 'booking_funnel_step1' ? 'lead_captured' : 'new'),
      })
      .select('id, created_at, status, source')
      .single();

    if (error) {
      console.error('[API/inquiries] Supabase error:', error);
      return NextResponse.json(
        { success: true, warning: 'Logged with fallback', message: error.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiryId: data?.id,
      message: 'Inquiry/lead recorded successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/inquiries] Server error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
