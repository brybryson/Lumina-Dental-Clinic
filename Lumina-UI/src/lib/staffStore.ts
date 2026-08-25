export interface StaffUser {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'doctor' | 'front_desk';
  specialization?: string;
  license_number?: string | null;
  birthdate?: string;
  sex?: string;
  age?: number;
  location?: string;
  profile_completed?: boolean;
  status: 'active' | 'suspended';
  created_at: string;
}

// In-memory staff repository with PBKDF2 hashes
export let STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-1',
    email: 'bryantiversonmelliza03@gmail.com',
    password_hash: 'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8',
    name: 'Bryant Iverson Melliza',
    first_name: 'Bryant Iverson',
    last_name: 'Melliza',
    role: 'super_admin',
    specialization: 'Owner',
    license_number: null,
    location: 'Bonifacio Global City, Taguig',
    profile_completed: false,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-2',
    email: 'doctor@luminaclinic.com',
    password_hash: 'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8',
    name: 'Dr. Lumina, DDS',
    first_name: 'Lumina',
    last_name: 'DDS',
    role: 'doctor',
    specialization: 'Lead Attending Dentist',
    license_number: 'PRC-098234',
    location: 'Bonifacio Global City, Taguig',
    profile_completed: false,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-3',
    email: 'admin@luminaclinic.com',
    password_hash: 'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8',
    name: 'Clinical Reception & Care Team',
    first_name: 'Care',
    last_name: 'Coordinator',
    role: 'front_desk',
    specialization: 'Operations & Care Coordinator',
    license_number: null,
    location: 'Bonifacio Global City, Taguig',
    profile_completed: true,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 'staff-4',
    email: 'luminadentalclinic2026@gmail.com',
    password_hash: 'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8',
    name: 'Lumina Dental Studio Administrator',
    first_name: 'Studio',
    last_name: 'Admin',
    role: 'super_admin',
    specialization: 'Practice Administrator',
    license_number: null,
    location: 'Bonifacio Global City, Taguig',
    profile_completed: true,
    status: 'active',
    created_at: '2026-08-25T08:00:00Z',
  },
];

export function getStaffUsers(): StaffUser[] {
  return STAFF_USERS;
}

export function addStaffUser(user: StaffUser) {
  STAFF_USERS.push(user);
  return user;
}

export function updateStaffUser(idOrEmail: string, updates: Partial<StaffUser>) {
  const idx = STAFF_USERS.findIndex(
    (s) => s.id === idOrEmail || s.email.toLowerCase() === idOrEmail.toLowerCase()
  );
  if (idx !== -1) {
    STAFF_USERS[idx] = { ...STAFF_USERS[idx], ...updates };
    return STAFF_USERS[idx];
  }
  return null;
}

export function deleteStaffUser(id: string) {
  STAFF_USERS = STAFF_USERS.filter((s) => s.id !== id);
}
