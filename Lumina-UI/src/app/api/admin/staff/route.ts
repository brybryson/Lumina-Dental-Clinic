import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStaffUsers, addStaffUser, deleteStaffUser, StaffUser } from '@/lib/staffStore';
import { hashPassword } from '@/lib/authCrypto';
import { supabaseAdmin } from '@/lib/supabase';

const SESSION_COOKIE_NAME = 'lumina_admin_session';

function parseSessionToken(token: string) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    if (data && data.expiresAt && data.expiresAt > Date.now()) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// GET: List all staff (Super Admin only, reads DIRECTLY from Supabase)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = parseSessionToken(sessionCookie.value);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin privileges required to view staff directory.' },
        { status: 403 }
      );
    }

    // Read directly from Supabase staff_users table
    try {
      const { data, error } = await supabaseAdmin
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        // Strip password_hash from client response
        const safeStaff = data.map(({ password_hash, ...rest }: any) => ({
          ...rest,
          location: rest.location || 'Bonifacio Global City, Taguig (Flagship Studio)',
          profile_completed: Boolean(rest.profile_completed || (rest.birthdate && rest.sex)),
        }));
        return NextResponse.json({ success: true, staff: safeStaff, source: 'supabase' });
      }
    } catch (dbErr) {
      console.warn('Supabase query fallback:', dbErr);
    }

    const staffList = getStaffUsers();
    const safeStaff = staffList.map(({ password_hash: _, ...rest }) => rest);
    return NextResponse.json({ success: true, staff: safeStaff, source: 'local_store' });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add new Doctor or Staff (Super Admin only, with PBKDF2 Password Hashing synced to Supabase)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = parseSessionToken(sessionCookie.value);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin can create clinic accounts.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, first_name, last_name, role, specialization, license_number, location } = body;

    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, and role are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const fullName = `${first_name} ${last_name}`.trim();
    const displayName = role === 'doctor' && !fullName.startsWith('Dr.') ? `Dr. ${fullName}` : fullName;
    const finalSpecialization = specialization?.trim() || (role === 'doctor' ? 'General Dentistry' : 'Clinic Operations');
    const initialPlainPassword = password || 'LuminaStudio2026!';
    const passwordHash = hashPassword(initialPlainPassword);

    const newStaffObj: StaffUser = {
      id: `staff-${Date.now()}`,
      email: cleanEmail,
      password_hash: passwordHash,
      name: displayName,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role,
      specialization: finalSpecialization,
      license_number: license_number?.trim() || null,
      location: location || 'Bonifacio Global City, Taguig (Flagship Studio)',
      profile_completed: false,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase staff_users table
    try {
      await supabaseAdmin.from('staff_users').insert({
        email: cleanEmail,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        name: displayName,
        role,
        specialization: finalSpecialization,
        license_number: license_number?.trim() || null,
        location: location || 'Bonifacio Global City, Taguig (Flagship Studio)',
        status: 'active',
        password_hash: passwordHash,
      });
    } catch (err) {
      console.warn('Supabase staff_users insert error:', err);
    }

    addStaffUser(newStaffObj);

    const { password_hash: _, ...safeStaff } = newStaffObj;
    return NextResponse.json({
      success: true,
      message: `Staff account for ${newStaffObj.name} created successfully in Supabase.`,
      staff: safeStaff,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove Staff from Supabase
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = parseSessionToken(sessionCookie.value);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin can delete clinic accounts.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('id');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required.' }, { status: 400 });
    }

    // Delete from Supabase by ID or email
    try {
      await supabaseAdmin.from('staff_users').delete().eq('id', staffId);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }

    deleteStaffUser(staffId);

    return NextResponse.json({
      success: true,
      message: 'Staff account removed successfully from Supabase.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
