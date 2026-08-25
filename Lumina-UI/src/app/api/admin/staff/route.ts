import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStaffUsers, addStaffUser, deleteStaffUser, StaffUser } from '@/lib/staffStore';

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

// GET: List all staff (Super Admin only)
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

    const staffList = getStaffUsers();
    // Return staff without passwords
    const safeStaff = staffList.map(({ password: _, ...rest }) => rest);
    return NextResponse.json({ success: true, staff: safeStaff });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add new Doctor or Staff (Super Admin only)
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
    const { email, password, first_name, last_name, role, specialization, license_number } = body;

    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, and role are required.' },
        { status: 400 }
      );
    }

    const staffList = getStaffUsers();
    // Check duplicate email
    if (staffList.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'A staff member with this email address already exists.' },
        { status: 400 }
      );
    }

    const fullName = `${first_name} ${last_name}`.trim();
    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password: password || 'LuminaStudio2026!',
      name: role === 'doctor' && !fullName.startsWith('Dr.') ? `Dr. ${fullName}` : fullName,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role,
      specialization: specialization?.trim() || (role === 'doctor' ? 'General Dentistry' : 'Clinic Operations'),
      license_number: license_number?.trim() || null,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    addStaffUser(newStaff);

    const { password: _, ...safeStaff } = newStaff;
    return NextResponse.json({
      success: true,
      message: `Staff account for ${newStaff.name} created successfully.`,
      staff: safeStaff,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate/Remove Staff (Super Admin only)
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

    const staffList = getStaffUsers();
    // Prevent deleting the primary owner
    const target = staffList.find((s) => s.id === staffId);
    if (target?.email === 'bryantiversonmelliza03@gmail.com') {
      return NextResponse.json(
        { error: 'Cannot remove the primary Super Admin practice owner.' },
        { status: 400 }
      );
    }

    deleteStaffUser(staffId);

    return NextResponse.json({
      success: true,
      message: 'Staff account removed successfully.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
