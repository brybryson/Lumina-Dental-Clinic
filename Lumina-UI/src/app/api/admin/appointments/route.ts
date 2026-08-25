import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch appointments with joined patient details and medical intake records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const statusParam = searchParams.get('status');

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        id,
        service_name,
        appointment_date,
        time_slot,
        patient_notes,
        status,
        google_calendar_event_id,
        intake_token,
        intake_completed_at,
        flag_for_manual_followup,
        created_at,
        patients (
          id,
          first_name,
          last_name,
          email,
          mobile,
          date_of_birth,
          sex_assigned_at_birth,
          last_visit_date,
          recall_sent
        ),
        medical_intakes (
          id,
          submitted_at,
          date_of_birth,
          emergency_contact_name,
          emergency_contact_phone,
          medical_conditions,
          allergies,
          current_medications,
          hmo_provider,
          hmo_member_id,
          consent_signed,
          alert_acknowledged
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (dateParam) {
      query = query.eq('appointment_date', dateParam);
    }

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API/admin/appointments] Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointments: data || [] });
  } catch (err: unknown) {
    console.error('[API/admin/appointments] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH: Update appointment status, completion outcome, and clinical flags
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      appointmentId,
      status,
      flagForManualFollowup,
      patientNotes,
    } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required.' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {};

    if (status) {
      updatePayload.status = status;
    }

    if (typeof flagForManualFollowup === 'boolean') {
      updatePayload.flag_for_manual_followup = flagForManualFollowup;
    }

    if (typeof patientNotes === 'string') {
      updatePayload.patient_notes = patientNotes;
    }

    const { data: updatedAppointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select('*, patients(*)')
      .single();

    if (error) {
      console.error('[API/admin/appointments] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If status was marked completed and not flagged for complication, also update patients.last_visit_date
    if (status === 'completed' && !flagForManualFollowup && updatedAppointment.patient_id) {
      await supabaseAdmin
        .from('patients')
        .update({
          last_visit_date: updatedAppointment.appointment_date || new Date().toISOString().split('T')[0],
          recall_sent: false,
        })
        .eq('id', updatedAppointment.patient_id);
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: `Appointment ${status === 'completed' ? 'marked as completed' : 'updated'} successfully.`,
    });
  } catch (err: unknown) {
    console.error('[API/admin/appointments] PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
