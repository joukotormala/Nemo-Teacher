import crypto from 'crypto';

// Decode base32 to buffer
function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  const length = clean.length;
  const bits = length * 5;
  const buffer = Buffer.alloc(Math.floor(bits / 8));
  
  let val = 0;
  let count = 0;
  let index = 0;
  
  for (let i = 0; i < length; i++) {
    const char = clean[i];
    const idx = alphabet.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character');
    val = (val << 5) | idx;
    count += 5;
    if (count >= 8) {
      buffer[index++] = (val >>> (count - 8)) & 0xff;
      count -= 8;
    }
  }
  return buffer;
}

// Generate HOTP code
export function generateHOTP(secret: string, counter: number): string {
  const key = base32Decode(secret);
  
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = temp & 0xff;
    temp = temp >> 8;
  }
  
  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();
  
  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  
  const code = binary % 1000000;
  return code.toString().padStart(6, '0');
}

// Verify TOTP (allowing window of 1 step before/after for clock drift)
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (let i = -1; i <= 1; i++) {
      if (generateHOTP(secret, currentStep + i) === code) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }
}
