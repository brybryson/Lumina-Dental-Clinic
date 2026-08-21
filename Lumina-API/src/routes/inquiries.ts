import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export const inquiriesRouter = Router();

// POST /api/inquiries - Submit a general/clinical inquiry
inquiriesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, service, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      res.status(400).json({ error: 'First name, last name, email, and message are required.' });
      return;
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        service_of_interest: service || null,
        message: message.trim(),
        status: 'new',
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[API/inquiries] Supabase insert error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      inquiryId: data?.id,
      message: 'Inquiry received successfully.',
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
