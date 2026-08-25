import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const adminRouter = Router();

// GET /api/admin/appointments
adminRouter.get('/appointments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, status } = req.query;

    let query = supabase
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

    if (date && typeof date === 'string') {
      query = query.eq('appointment_date', date);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, appointments: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
});

// PATCH /api/admin/appointments
adminRouter.patch('/appointments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId, status, flagForManualFollowup, patientNotes } = req.body;

    if (!appointmentId) {
      res.status(400).json({ error: 'appointmentId is required.' });
      return;
    }

    const updatePayload: Record<string, any> = {};
    if (status) updatePayload.status = status;
    if (typeof flagForManualFollowup === 'boolean') updatePayload.flag_for_manual_followup = flagForManualFollowup;
    if (typeof patientNotes === 'string') updatePayload.patient_notes = patientNotes;

    const { data, error } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select('*, patients(*)')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // If completed and no complication flag, update last_visit_date
    if (status === 'completed' && !flagForManualFollowup && data.patient_id) {
      await supabase
        .from('patients')
        .update({
          last_visit_date: data.appointment_date || new Date().toISOString().split('T')[0],
          recall_sent: false,
        })
        .eq('id', data.patient_id);
    }

    res.json({ success: true, appointment: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
});

// GET /api/admin/inquiries
adminRouter.get('/inquiries', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, inquiries: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
});
