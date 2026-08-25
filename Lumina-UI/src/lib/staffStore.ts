export interface StaffUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'doctor' | 'front_desk';
  specialization?: string;
  license_number?: string | null;
  status: 'active' | 'suspended';
  created_at: string;
}

// In-memory staff repository initialized with default accounts
export let STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-1',
    email: 'bryantiversonmelliza03@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Bryant Iverson Melliza',
    first_name: 'Bryant Iverson',
    last_name: 'Melliza',
    role: 'super_admin',
    specialization: 'Owner',
    license_number: null,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-2',
    email: 'doctor@luminaclinic.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Dr. Lumina, DDS',
    first_name: 'Lumina',
    last_name: 'DDS',
    role: 'doctor',
    specialization: 'Lead Attending Dentist',
    license_number: 'PRC-098234',
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-3',
    email: 'admin@luminaclinic.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Clinical Reception & Care Team',
    first_name: 'Care',
    last_name: 'Coordinator',
    role: 'front_desk',
    specialization: 'Operations & Care Coordinator',
    license_number: null,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-4',
    email: 'luminadentalclinic2026@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Lumina Dental Studio Administrator',
    first_name: 'Studio',
    last_name: 'Admin',
    role: 'super_admin',
    specialization: 'Practice Administrator',
    license_number: null,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
];

export function getStaffUsers() {
  return STAFF_USERS;
}

export function addStaffUser(user: StaffUser) {
  STAFF_USERS.push(user);
  return user;
}

export function deleteStaffUser(id: string) {
  STAFF_USERS = STAFF_USERS.filter((s) => s.id !== id);
}
