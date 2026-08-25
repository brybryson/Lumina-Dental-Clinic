import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Archive any open/unbooked inquiries to halt Lead Recovery (Workflow 5)
    const { error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .update({ status: 'archived' })
      .eq('email', cleanEmail)
      .in('status', ['new', 'lead_captured', 'in_review']);

    if (inquiryError) {
      console.warn('[API/unsubscribe] Inquiry archive notice:', inquiryError.message);
    }

    // 2. Mark patients recall_sent = TRUE to halt 6-Month Recall Engine (Workflow 4)
    const { error: patientError } = await supabaseAdmin
      .from('patients')
      .update({ recall_sent: true, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    if (patientError) {
      console.warn('[API/unsubscribe] Patient recall opt-out notice:', patientError.message);
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      message: 'You have been successfully unsubscribed from automated clinic reminders.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[API/unsubscribe] Server error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'Valid email query parameter required.' },
      { status: 400 }
    );
  }

  const cleanEmail = email.trim().toLowerCase();

  // Perform opt-out directly on GET if requested by email link
  const { error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .update({ status: 'archived' })
    .eq('email', cleanEmail)
    .in('status', ['new', 'lead_captured', 'in_review']);

  if (inquiryError) {
    console.warn('[API/unsubscribe GET] Inquiry archive notice:', inquiryError.message);
  }

  const { error: patientError } = await supabaseAdmin
    .from('patients')
    .update({ recall_sent: true, updated_at: new Date().toISOString() })
    .eq('email', cleanEmail);

  if (patientError) {
    console.warn('[API/unsubscribe GET] Patient recall opt-out notice:', patientError.message);
  }

  return NextResponse.json({
    success: true,
    email: cleanEmail,
    message: 'You have been successfully unsubscribed from automated clinic reminders.',
  });
}
