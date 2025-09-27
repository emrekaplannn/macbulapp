// api/auth.ts
import api from '../lib/api';

export async function resendEmailCode(email: string): Promise<void> {
  const res = await api.post('/otp', {
    type: 'EMAIL_VERIFY',
    destination: email,
  });
  // genelde sadece 200 OK döner; özel bir alan varsa burada döndürebilirsin
  return res.data;
}

export async function verifyEmailCode(code: string): Promise<any> {
  const res = await api.post('/otp/verify', {
    type: 'EMAIL_VERIFY',
    code,
  });

  // status kontrolü
  if (res.status < 200 || res.status >= 300) {
    throw new Error('Verification failed');
  }

  // backend success flag kontrolü (eğer varsa)
  if (res.data?.success === false) {
    throw new Error(res.data.message || 'Verification failed');
  }

  return res.data;      // OtpVerifyResponse (örneğin { verified: true, ... })
}
