import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { verifyTOTP } from '@/lib/totp';

export const dynamic = 'force-dynamic';

const ADMIN_2FA_SECRET = process.env.ADMIN_2FA_SECRET || 'NEMOTEACHER2FASECRETKEY';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'nemo_admin_jwt_secret_key_2026';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Authentication code is required' }, { status: 400 });
    }

    // Verify 2FA TOTP code
    const isValid = verifyTOTP(ADMIN_2FA_SECRET, code);

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid code. Please try again.' }, { status: 401 });
    }

    // Sign JWT
    const token = jwt.sign(
      { role: 'admin', verifiedAt: new Date().toISOString() },
      ADMIN_JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set('nemo_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify 2FA API error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
