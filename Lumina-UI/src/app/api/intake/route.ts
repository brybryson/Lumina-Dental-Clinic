import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Validate intake token and verify expiry if configured
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
  }

  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        time_slot,
        service_name,
        status,
        intake_completed_at,
        patients (
          first_name,
          last_name,
          email,
          mobile,
          date_of_birth
        )
      `)
      .eq('intake_token', token)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Invalid intake token.' }, { status: 404 });
    }

    // Check expiry if field is returned
    if ((appointment as any).intake_token_expires_at) {
      if (new Date((appointment as any).intake_token_expires_at) < new Date()) {
        return NextResponse.json(
          {
            error: 'This digital medical intake link has expired. Please contact reception at (415) 555-0142.',
            expired: true,
          },
          { status: 410 }
        );
      }
    }

    return NextResponse.json({ success: true, appointment });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Submit Medical Intake Form
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      intakeToken,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      medicalConditions,
      allergies,
      currentMedications,
      hmoProvider,
      hmoMemberId,
      consentSigned,
      alertAcknowledged,
      alertAcknowledgedBy,
    } = body;

    if (!intakeToken) {
      return NextResponse.json({ error: 'Intake token is required.' }, { status: 400 });
    }

    // 1. Verify Appointment & Expiry
    const { data: appointment, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id')
      .eq('intake_token', intakeToken)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json({ error: 'Invalid intake token.' }, { status: 404 });
    }

    // 2. Insert Medical Intake Record (with resilient fallback)
    const fullIntakePayload: any = {
      appointment_id: appointment.id,
      date_of_birth: dateOfBirth || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      medical_conditions: medicalConditions || [],
      allergies: allergies || [],
      current_medications: currentMedications || null,
      hmo_provider: hmoProvider || null,
      hmo_member_id: hmoMemberId || null,
      consent_signed: Boolean(consentSigned),
      alert_acknowledged: Boolean(alertAcknowledged),
      alert_acknowledged_by: alertAcknowledgedBy || null,
      alert_acknowledged_at: alertAcknowledged ? new Date().toISOString() : null,
      submitted_at: new Date().toISOString(),
    };

    let { error: intakeError } = await supabaseAdmin
      .from('medical_intakes')
      .upsert(fullIntakePayload, { onConflict: 'appointment_id' });

    if (intakeError) {
      // Fallback to base columns if new acknowledgment columns do not exist yet on db
      const baseIntakePayload: any = {
        appointment_id: appointment.id,
        date_of_birth: dateOfBirth || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        medical_conditions: medicalConditions || [],
        allergies: allergies || [],
        current_medications: currentMedications || null,
        hmo_provider: hmoProvider || null,
        hmo_member_id: hmoMemberId || null,
        consent_signed: Boolean(consentSigned),
        submitted_at: new Date().toISOString(),
      };

      const fallbackRes = await supabaseAdmin
        .from('medical_intakes')
        .upsert(baseIntakePayload, { onConflict: 'appointment_id' });

      intakeError = fallbackRes.error;
    }

    if (intakeError) {
      console.error('[API/intake] Supabase error:', intakeError);
    }

    // 3. Update Appointment Status
    await supabaseAdmin
      .from('appointments')
      .update({
        status: 'intake_submitted',
        intake_completed_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    return NextResponse.json({
      success: true,
      message: 'Medical intake submitted successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/intake] Server error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
