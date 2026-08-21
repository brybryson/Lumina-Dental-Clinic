import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const intakeRouter = Router();

// GET /api/intake/:token - Fetch patient & appointment details for pre-visit chart intake
intakeRouter.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: 'Token is required.' });
      return;
    }

    const { data: appointment, error } = await supabase
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
      res.status(404).json({ error: 'Invalid or expired intake token.' });
      return;
    }

    res.json({ success: true, appointment });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});

// POST /api/intake - Submit clinical intake history & medical questionnaire
intakeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
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
    } = req.body;

    if (!intakeToken) {
      res.status(400).json({ error: 'Intake token is required.' });
      return;
    }

    // 1. Verify Appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, patient_id')
      .eq('intake_token', intakeToken)
      .single();

    if (aptError || !appointment) {
      res.status(404).json({ error: 'Invalid intake token.' });
      return;
    }

    // 2. Insert or Upsert Medical Intake Record
    const { error: intakeError } = await supabase
      .from('medical_intakes')
      .upsert(
        {
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
        },
        { onConflict: 'appointment_id' }
      );

    if (intakeError) {
      console.error('[API/intake] Supabase intake insert error:', intakeError);
      res.status(500).json({ error: intakeError.message });
      return;
    }

    // 3. Mark appointment as intake_submitted
    await supabase
      .from('appointments')
      .update({
        status: 'intake_submitted',
        intake_completed_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    res.json({
      success: true,
      message: 'Medical intake chart submitted successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/intake] Unexpected server error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});
