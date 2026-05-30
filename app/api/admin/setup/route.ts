import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nemo_admin_2026';
const ADMIN_2FA_SECRET = process.env.ADMIN_2FA_SECRET || 'NEMOTEACHER2FASECRETKEY';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Incorrect password. Access denied.' }, { status: 401 });
    }

    // Generate URI for QR code setup
    const label = 'AI Teacher Nemo:Admin';
    const issuer = 'AI Teacher Nemo';
    const otpauthUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${ADMIN_2FA_SECRET}&issuer=${encodeURIComponent(issuer)}`;

    return NextResponse.json({
      success: true,
      secret: ADMIN_2FA_SECRET,
      otpauthUri,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`
    });
  } catch (error) {
    console.error('Setup 2FA API error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
