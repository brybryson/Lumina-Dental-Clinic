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
        intake_token_expires_at,
        source_inquiry_id,
        flag_for_manual_followup,
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
      res.status(404).json({ error: 'Invalid intake token.' });
      return;
    }

    // Check token expiration (14-day window)
    if (appointment.intake_token_expires_at && new Date(appointment.intake_token_expires_at) < new Date()) {
      res.status(410).json({
        error: 'This digital medical intake link has expired. Please contact reception at (415) 555-0142.',
        expired: true,
      });
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
      alertAcknowledged,
      alertAcknowledgedBy,
    } = req.body;

    if (!intakeToken) {
      res.status(400).json({ error: 'Intake token is required.' });
      return;
    }

    // 1. Verify Appointment & Expiry
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, patient_id, intake_token_expires_at')
      .eq('intake_token', intakeToken)
      .single();

    if (aptError || !appointment) {
      res.status(404).json({ error: 'Invalid intake token.' });
      return;
    }

    if (appointment.intake_token_expires_at && new Date(appointment.intake_token_expires_at) < new Date()) {
      res.status(410).json({
        error: 'This digital medical intake link has expired. Please contact reception at (415) 555-0142.',
        expired: true,
      });
      return;
    }

    // 2. Insert or Upsert Medical Intake Record with explicit consent tracking
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
          alert_acknowledged: Boolean(alertAcknowledged),
          alert_acknowledged_by: alertAcknowledgedBy || null,
          alert_acknowledged_at: alertAcknowledged ? new Date().toISOString() : null,
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
