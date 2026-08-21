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

    // 2. Insert Appointment
    const { data: appointment, error: aptError } = await supabase
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
      console.error('[API/appointments] Appointment insert error:', aptError);
      res.status(500).json({ error: aptError.message });
      return;
    }

    const intakeToken = appointment?.intake_token;
    res.status(201).json({
      success: true,
      appointmentId: appointment.id,
      intakeToken,
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

    res.json({ success: true, appointments: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});
