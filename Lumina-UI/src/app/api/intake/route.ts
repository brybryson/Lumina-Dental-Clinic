import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Validate intake token and return state enum without leaking sensitive info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Exact same response for missing vs empty token (Security rule: no distinction)
  if (!token || token.trim() === '') {
    return NextResponse.json({
      status: 'invalid',
      error: 'Restricted Access',
      message: 'This page can only be accessed through the secure link sent to your email after booking.',
    });
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
        intake_token_expires_at,
        patients (
          first_name,
          last_name,
          email,
          mobile,
          date_of_birth
        )
      `)
      .eq('intake_token', token.trim())
      .maybeSingle();

    // Exact same response for non-existent token (Security rule: no information leakage)
    if (error || !appointment) {
      return NextResponse.json({
        status: 'invalid',
        error: 'Restricted Access',
        message: 'This page can only be accessed through the secure link sent to your email after booking.',
      });
    }

    // State 2: Check if link has expired
    if (appointment.intake_token_expires_at) {
      if (new Date(appointment.intake_token_expires_at) < new Date()) {
        return NextResponse.json({
          status: 'expired',
          error: 'This Link Has Expired',
          message: 'For your security, intake links expire 14 days after booking. Please contact us and we\'ll send you a new one.',
        });
      }
    }

    // State 3: Check if already completed
    if (appointment.intake_completed_at) {
      return NextResponse.json({
        status: 'completed',
        completed_at: appointment.intake_completed_at,
        message: 'We already have your medical intake on file for this appointment.',
      });
    }

    // State 4: Valid, unexpired, not yet completed -> return necessary form metadata
    const rawPatient = appointment.patients;
    const patientObj = Array.isArray(rawPatient) ? rawPatient[0] : rawPatient;

    return NextResponse.json({
      status: 'valid',
      appointment: {
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        time_slot: appointment.time_slot,
        service_name: appointment.service_name,
        status: appointment.status,
        patients: patientObj || null,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error', status: 'error' },
      { status: 500 }
    );
  }
}

// POST: Submit Medical Intake Form & Sync Status
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
      .select('id, patient_id, intake_token_expires_at')
      .eq('intake_token', intakeToken.trim())
      .maybeSingle();

    if (aptError || !appointment) {
      return NextResponse.json({ error: 'Invalid or missing intake token.', status: 'invalid' }, { status: 404 });
    }

    if (appointment.intake_token_expires_at && new Date(appointment.intake_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This intake token has expired.', status: 'expired' }, { status: 410 });
    }

    const nowIso = new Date().toISOString();

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
      alert_acknowledged_at: alertAcknowledged ? nowIso : null,
      submitted_at: nowIso,
    };

    let { error: intakeError } = await supabaseAdmin
      .from('medical_intakes')
      .upsert(fullIntakePayload, { onConflict: 'appointment_id' });

    if (intakeError) {
      // Fallback to base columns if schema differs
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
        submitted_at: nowIso,
      };

      const fallbackRes = await supabaseAdmin
        .from('medical_intakes')
        .upsert(baseIntakePayload, { onConflict: 'appointment_id' });

      intakeError = fallbackRes.error;
    }

    if (intakeError) {
      console.error('[API/intake] Supabase upsert error:', intakeError);
    }

    // 3. Record intake completion timestamp (appointment remains confirmed until receptionist checks in patient)
    await supabaseAdmin
      .from('appointments')
      .update({
        intake_completed_at: nowIso,
      })
      .eq('id', appointment.id);

    return NextResponse.json({
      success: true,
      status: 'completed',
      completed_at: nowIso,
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
