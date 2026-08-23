import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const appointmentsRouter = Router();

// POST /api/appointments - Register patient & book chairside appointment
appointmentsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
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
    } = req.body;

    if (!firstName || !lastName || !email || !mobile || !service || !date || !time) {
      res.status(400).json({ error: 'Missing required booking fields.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Upsert Patient in Supabase
    let patientId: string | null = null;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      await supabase
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
      const { data: newPatient, error: patientError } = await supabase
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

      if (patientError) {
        console.error('[API/appointments] Patient insert error:', patientError);
      }
      if (newPatient) {
        patientId = newPatient.id;
      }
    }

    // 2. Identify and Link Source Inquiry Lead
    let linkedInquiryId = sourceInquiryId || null;
    if (!linkedInquiryId) {
      const { data: matchedInquiry } = await supabase
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
    }

    // 2.5 Double-Booking Prevention: Ensure slot is not already reserved
    const { data: existingSlot } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', date)
      .eq('time_slot', time)
      .neq('status', 'cancelled')
      .limit(1)
      .maybeSingle();

    if (existingSlot) {
      return res.status(409).json({
        error: `The ${time} slot on ${date} has already been reserved. Please choose another date or time slot.`,
      });
    }

    // 3. Insert Appointment with 14-day token expiration and foreign key link
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        service_name: service,
        appointment_date: date,
        time_slot: time,
        patient_notes: notes || null,
        status: 'confirmed',
        source_inquiry_id: linkedInquiryId,
        flag_for_manual_followup: Boolean(flagForManualFollowup),
        intake_token_expires_at: expiresAt,
      })
      .select('id, intake_token, intake_token_expires_at, created_at')
      .single();

    if (aptError) {
      console.error('[API/appointments] Appointment insert error:', aptError);
      res.status(500).json({ error: aptError.message });
      return;
    }

    // 4. Mark the linked inquiry as converted
    if (linkedInquiryId) {
      await supabase
        .from('inquiries')
        .update({ status: 'converted' })
        .eq('id', linkedInquiryId);
    }

    const intakeToken = appointment?.intake_token;
    res.status(201).json({
      success: true,
      appointmentId: appointment.id,
      intakeToken,
      intakeExpiresAt: appointment.intake_token_expires_at,
      message: 'Appointment reserved successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/appointments] Unexpected server error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});

// GET /api/appointments - List appointments with patient details
appointmentsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          email,
          mobile,
          date_of_birth,
          sex_assigned_at_birth
        )
      `)
      .order('appointment_date', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Build schedule dictionary for live calendar lockout
    const schedule: Record<string, string[]> = {};
    (data || []).forEach((apt: any) => {
      if (apt.appointment_date && apt.time_slot && apt.status !== 'cancelled') {
        const dateKey = apt.appointment_date;
        if (!schedule[dateKey]) {
          schedule[dateKey] = [];
        }
        if (!schedule[dateKey].includes(apt.time_slot)) {
          schedule[dateKey].push(apt.time_slot);
        }
      }
    });

    res.json({ success: true, schedule, appointments: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});
