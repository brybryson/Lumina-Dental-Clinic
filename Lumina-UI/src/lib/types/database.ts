export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Inquiry = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  service_of_interest?: string | null;
  message: string;
  status: 'new' | 'in_review' | 'replied' | 'archived';
};

export type Patient = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth?: string | null;
  sex_assigned_at_birth?: 'Female' | 'Male' | string | null;
  last_visit_date?: string | null;
  recall_sent?: boolean;
};

export type Appointment = {
  id: string;
  created_at: string;
  patient_id: string;
  service_name: string;
  appointment_date: string;
  time_slot: string;
  patient_notes?: string | null;
  status: 'lead_captured' | 'confirmed' | 'intake_submitted' | 'completed' | 'cancelled' | 'no_show';
  google_calendar_event_id?: string | null;
  intake_token: string;
  intake_completed_at?: string | null;
};

export type MedicalIntake = {
  id: string;
  appointment_id: string;
  submitted_at: string;
  date_of_birth?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_conditions?: string[];
  allergies?: string[];
  current_medications?: string | null;
  hmo_provider?: string | null;
  hmo_member_id?: string | null;
  consent_signed: boolean;
};
