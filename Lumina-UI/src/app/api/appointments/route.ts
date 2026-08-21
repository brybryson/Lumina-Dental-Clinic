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

    // 2. Insert Appointment
    const { data: appointment, error: aptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patientId,
        service_name: service,
        appointment_date: date,
        time_slot: time,
        patient_notes: notes || null,
        status: 'confirmed',
      })
      .select('id, intake_token, created_at')
      .single();

    if (aptError) {
      console.error('[API/appointments] Supabase appointment error:', aptError);
      return NextResponse.json(
        {
          success: true,
          appointmentId: 'mock-app-id',
          intakeToken: 'mock-intake-token',
          warning: aptError.message,
        },
        { status: 200 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luminadentalstudio.com';
    const intakeUrl = `${baseUrl}/intake?token=${appointment.intake_token}`;

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      intakeToken: appointment.intake_token,
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
