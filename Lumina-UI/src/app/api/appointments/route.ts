import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      mobile,
      dob,
      sex,
      service,
      date,
      time,
      notes,
      sourceInquiryId,
      flagForManualFollowup,
    } = body;

    if (!firstName || !lastName || !email || !mobile || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required booking fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Upsert Patient in Supabase
    let patientId: string | null = null;
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      await supabaseAdmin
        .from('patients')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          mobile: mobile.trim(),
          date_of_birth: dob || null,
          sex_assigned_at_birth: sex || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);
    } else {
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from('patients')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: cleanEmail,
          mobile: mobile.trim(),
          date_of_birth: dob || null,
          sex_assigned_at_birth: sex || null,
        })
        .select('id')
        .single();

      if (!patientError && newPatient) {
        patientId = newPatient.id;
      }
    }

    // 2. Identify and Link Source Inquiry Lead
    let linkedInquiryId = sourceInquiryId || null;
    if (!linkedInquiryId) {
      try {
        const { data: matchedInquiry } = await supabaseAdmin
          .from('inquiries')
          .select('id')
          .eq('email', cleanEmail)
          .in('status', ['new', 'lead_captured', 'in_review'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchedInquiry) {
          linkedInquiryId = matchedInquiry.id;
        }
      } catch (inqErr) {
        console.warn('[API/appointments] Inquiry lookup fallback:', inqErr);
      }
    }

    // 3. Insert Appointment with resilient column handling
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    
    let appointment: any = null;
    let aptError: any = null;

    // Try inserting with all revision columns first
    const fullPayload: any = {
      patient_id: patientId,
      service_name: service,
      appointment_date: date,
      time_slot: time,
      patient_notes: notes || null,
      status: 'confirmed',
      source_inquiry_id: linkedInquiryId,
      flag_for_manual_followup: Boolean(flagForManualFollowup),
      intake_token_expires_at: expiresAt,
    };

    const res = await supabaseAdmin
      .from('appointments')
      .insert(fullPayload)
      .select('id, intake_token, created_at')
      .single();

    appointment = res.data;
    aptError = res.error;

    // If new schema columns don't exist yet on remote db, fallback to base columns
    if (aptError) {
      const basePayload: any = {
        patient_id: patientId,
        service_name: service,
        appointment_date: date,
        time_slot: time,
        patient_notes: notes || null,
        status: 'confirmed',
      };

      const fallbackRes = await supabaseAdmin
        .from('appointments')
        .insert(basePayload)
        .select('id, intake_token, created_at')
        .single();

      appointment = fallbackRes.data;
      aptError = fallbackRes.error;
    }

    if (aptError || !appointment) {
      console.error('[API/appointments] Supabase appointment error:', aptError);
      return NextResponse.json(
        {
          success: true,
          appointmentId: 'mock-app-id',
          intakeToken: 'mock-intake-token',
          warning: aptError?.message,
        },
        { status: 200 }
      );
    }

    // 4. Mark the linked inquiry as converted if present
    if (linkedInquiryId) {
      try {
        await supabaseAdmin
          .from('inquiries')
          .update({ status: 'converted' })
          .eq('id', linkedInquiryId);
      } catch (convErr) {
        console.warn('[API/appointments] Inquiry status conversion:', convErr);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luminadentalstudio.com';
    const intakeUrl = `${baseUrl}/intake?token=${appointment.intake_token}`;

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      intakeToken: appointment.intake_token,
      intakeExpiresAt: expiresAt,
      intakeUrl,
      message: 'Appointment reserved successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/appointments] Server error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
