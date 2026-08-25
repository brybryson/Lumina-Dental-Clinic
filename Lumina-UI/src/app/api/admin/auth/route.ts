import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default staff credentials for clinical operations
const VALID_STAFF_USERS = [
  {
    email: 'doctor@luminaclinic.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Dr. Lumina, DDS',
    role: 'Lead Attending Dentist',
  },
  {
    email: 'admin@luminaclinic.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Clinical Reception & Care Team',
    role: 'Operations & Care Coordinator',
  },
  {
    email: 'luminadentalclinic2026@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'LuminaStudio2026!',
    name: 'Lumina Dental Studio Administrator',
    role: 'Practice Administrator',
  },
];

const SESSION_COOKIE_NAME = 'lumina_admin_session';

function generateSessionToken(user: { email: string; name: string; role: string }) {
  const payload = {
    ...user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

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

// POST: Staff Login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const staff = VALID_STAFF_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!staff) {
      return NextResponse.json(
        { error: 'Invalid clinical credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const token = generateSessionToken({
      email: staff.email,
      name: staff.name,
      role: staff.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET: Check Current Session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = parseSessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// DELETE: Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
