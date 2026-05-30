import { verifyTOTP, generateHOTP } from '../lib/totp';

console.log('--- Testing TOTP Cryptography ---');
try {
  const secret = 'NEMOTEACHER2FASECRETKEY';
  const currentStep = Math.floor(Date.now() / 1000 / 30);
  
  console.log('Secret:', secret);
  console.log('Current Step:', currentStep);
  
  const code = generateHOTP(secret, currentStep);
  console.log('Generated Code:', code);
  
  const isValid = verifyTOTP(secret, code);
  console.log('Verify self-generated code:', isValid);
  
  const isInvalid = verifyTOTP(secret, '000000');
  console.log('Verify invalid code (000000):', isInvalid);
  
  console.log('--- Crypto library works correctly ---');
} catch (err: any) {
  console.error('TOTP cryptographic error:', err.message || err);
}
process.exit(0);
