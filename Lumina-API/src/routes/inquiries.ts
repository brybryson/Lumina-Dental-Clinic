import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const inquiriesRouter = Router();

// POST /api/inquiries - Submit a general inquiry or capture booking funnel Step 1 lead
inquiriesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, service, message, source, status } = req.body;

    if (!firstName || !email) {
      res.status(400).json({ error: 'First name and email are required.' });
      return;
    }

    const leadSource = source || 'contact_modal';

    // For organic contact modal inquiries, a message is required
    if (leadSource === 'contact_modal' && !message) {
      res.status(400).json({ error: 'Message is required for general inquiries.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName ? lastName.trim() : null,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        service_of_interest: service || null,
        message: message ? message.trim() : null,
        source: leadSource,
        status: status || (leadSource === 'booking_funnel_step1' ? 'lead_captured' : 'new'),
      })
      .select('id, created_at, status, source')
      .single();

    if (error) {
      console.error('[API/inquiries] Supabase insert error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      inquiryId: data?.id,
      message: 'Inquiry/lead recorded successfully.',
    });
  } catch (err: unknown) {
    console.error('[API/inquiries] Unexpected server error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});

// GET /api/inquiries - List inquiries (for admin / reception)
inquiriesRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, inquiries: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});
