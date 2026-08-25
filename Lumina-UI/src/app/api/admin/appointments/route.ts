import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getSlotEndTime24(timeSlot: string): string | null {
  const parts = timeSlot.split(/[–-]/);
  const endPart = (parts[1] || parts[0]).trim();
  const match = endPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${mins}`;
}

// GET: Fetch appointments with joined patient details and medical intake records
// Automatically auto-tags past unattended time slots to 'no_show' in Supabase
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

    let appointments = data || [];

    // Auto-tag past unattended appointments to 'no_show' in Supabase
    const now = new Date();
    const manilaDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now);
    const manilaTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    const pastDueIds: string[] = [];
    appointments = appointments.map((apt: any) => {
      if (apt.status === 'confirmed' || apt.status === 'intake_submitted' || apt.status === 'pending') {
        const isPastDay = apt.appointment_date < manilaDateStr;
        const isSameDay = apt.appointment_date === manilaDateStr;
        const endTime = getSlotEndTime24(apt.time_slot);
        const isPastTime = isSameDay && endTime && manilaTimeStr >= endTime;

        if (isPastDay || isPastTime) {
          pastDueIds.push(apt.id);
          return { ...apt, status: 'no_show' };
        }
      }
      return apt;
    });

    if (pastDueIds.length > 0) {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({ status: 'no_show' })
          .in('id', pastDueIds);
      } catch (patchErr) {
        console.warn('Auto no-show update warning:', patchErr);
      }
    }

    return NextResponse.json({ success: true, appointments });
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

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('[API/admin/appointments] Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: unknown) {
    console.error('[API/admin/appointments] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
