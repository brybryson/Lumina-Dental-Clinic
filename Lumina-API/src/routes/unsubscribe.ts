import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const unsubscribeRouter = Router();

// POST /api/unsubscribe - Opt out an email from marketing and recall automations
unsubscribeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Archive any open/unbooked inquiries to halt Lead Recovery (Workflow 5)
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({ status: 'archived' })
      .eq('email', cleanEmail)
      .in('status', ['new', 'lead_captured', 'in_review']);

    if (inquiryError) {
      console.warn('[Lumina-API/unsubscribe] Inquiry archive warning:', inquiryError.message);
    }

    // 2. Mark patients recall_sent = TRUE to halt 6-Month Recall Engine (Workflow 4)
    const { error: patientError } = await supabase
      .from('patients')
      .update({ recall_sent: true, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    if (patientError) {
      console.warn('[Lumina-API/unsubscribe] Patient recall opt-out warning:', patientError.message);
    }

    res.json({
      success: true,
      email: cleanEmail,
      message: 'You have been successfully unsubscribed from automated clinic reminders.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Lumina-API/unsubscribe] Server error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
});

// GET /api/unsubscribe - Handle link click directly
unsubscribeRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.query.email as string;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email query parameter required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Archive inquiries
    await supabase
      .from('inquiries')
      .update({ status: 'archived' })
      .eq('email', cleanEmail)
      .in('status', ['new', 'lead_captured', 'in_review']);

    // 2. Mark recall sent
    await supabase
      .from('patients')
      .update({ recall_sent: true, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    res.json({
      success: true,
      email: cleanEmail,
      message: 'You have been successfully unsubscribed from automated clinic reminders.',
    });
  } catch (err: unknown) {
    console.error('[Lumina-API/unsubscribe GET] Server error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
});
