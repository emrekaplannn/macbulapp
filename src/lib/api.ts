// src/lib/api.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../state/authStore';
import Config from 'react-native-config';

export const API_BASE_URL = Config.API_URL; // e.g. http://10.0.2.2:8080/v1

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    // Buradaki header'lar default; interceptor FormData için override etmeyecek
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** ---------- helpers ---------- */
function joinUrl(baseURL?: string, url?: string) {
  const b = baseURL || '';
  const u = url || '';
  if (!b) return u;
  if (!u) return b;
  return u.startsWith('http') ? u : `${b.replace(/\/+$/, '')}/${u.replace(/^\/+/, '')}`;
}

// /auth, /auth/, /auth/login, /auth/refresh gibi uçları yakalar; /oauth yanlış pozitif olmaz
function isAuthRequest(config: AxiosRequestConfig) {
  const full = joinUrl(config.baseURL as string, config.url as string);
  return /\/auth(?:\/|$)/.test(full);
}

// RN FormData tespiti (polyfill'li ortamlarda instanceof çalışmayabilir)
function isRNFormData(data: any): boolean {
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  // RN FormData polyfili: {_parts: [...]}
  return !!data && typeof data === 'object' && Array.isArray((data as any)._parts);
}

const mask = (t?: string) => (t ? `${t.slice(0, 6)}…${t.slice(-6)}` : '(none)');

/** ---------- REQUEST INTERCEPTOR ---------- */
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // Eğer FormData ise Content-Type'ı ELLEME
  const looksLikeFormData = isRNFormData(config.data);
  const contentTypeHeader = String((config.headers as any)['Content-Type'] || (config.headers as any)['content-type'] || '');

  if (looksLikeFormData || contentTypeHeader.toLowerCase().startsWith('multipart/form-data')) {
    // RN boundary otomatik ekler; Accept'i istersen bırakabilirsin
    // Content-Type'ı kesinlikle override ETME
  } else {
    (config.headers as any)['Content-Type'] = 'application/json';
    (config.headers as any)['Accept'] = 'application/json';
  }

  const method = (config.method || 'get').toUpperCase();
  const full = joinUrl(config.baseURL as string, config.url as string);

  // OPTIONS ve /auth/* için Authorization ekleme
  if (method !== 'OPTIONS' && !isAuthRequest(config)) {
    const { accessToken, tokenType } = useAuthStore.getState();
    if (accessToken) {
      (config.headers as any).Authorization = `${tokenType ?? 'Bearer'} ${accessToken}`;
    }
  } else if ((config.headers as any).Authorization) {
    delete (config.headers as any).Authorization;
  }

  // ---- DEBUG (masked) ----
  const authHeader = String((config.headers as any).Authorization || '');
  const hasAuth = !!authHeader;
  const masked = hasAuth ? `${authHeader.slice(0, 12)}…${authHeader.slice(-6)}` : '(none)';
  console.log('[API][REQ]', method, full, 'Auth=', hasAuth ? 'YES' : 'NO');
  if (hasAuth) console.log('[API][REQ][AUTH]', masked);

  if (config.data) {
    try {
      if (looksLikeFormData) {
        const parts = (config.data as any)._parts;
        console.log('[API][REQ][BODY] FormData parts=', Array.isArray(parts) ? parts.length : 'unknown');
      } else {
        console.log(
          '[API][REQ][BODY]',
          typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
        );
      }
    } catch {
      // swallow
    }
  }

  return config;
});

/** ---------- RESPONSE + REFRESH FLOW ---------- */
let isRefreshing = false;
let queued: Array<() => void> = [];

api.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log(
      '[API][RES]',
      res.status,
      joinUrl(res.config?.baseURL as string, res.config?.url as string)
    );
    return res;
  },
  async (err) => {
    const { response, config, code, message } = err || {};
    const status = response?.status;
    const full = joinUrl(config?.baseURL, config?.url);

    console.log('[API][ERR]', status ?? code ?? 'NO_STATUS', full);
    if (message) console.log('[API][ERR][MSG]', message);
    if (response?.data) {
      try {
        console.log(
          '[API][ERR][DATA]',
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        );
      } catch {}
    }

    // Sadece 401'i burada ele al (403 -> ekranlar karar versin)
    if (!response || status !== 401 || (config as any)?._retry) {
      return Promise.reject(err);
    }

    // Auth endpointleri için refresh deneme yapma
    if (isAuthRequest(config)) {
      return Promise.reject(err);
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(err);
    }

    // Zaten refresh oluyorsa -> kuyruğa al
    if (isRefreshing) {
      return new Promise((resolve) => {
        queued.push(() => {
          const { accessToken, tokenType } = useAuthStore.getState();
          if (accessToken) {
            (config.headers as any) = (config.headers as any) || {};
            (config.headers as any).Authorization = `${tokenType ?? 'Bearer'} ${accessToken}`;
            (config as any)._retry = true;
            resolve(api(config));
          } else {
            resolve(Promise.reject(err));
          }
        });
      });
    }

    // Refresh başlat
    isRefreshing = true;
    try {
      console.log('[API][REFRESH] start');
      const resp = await axios.post(
        `${API_BASE_URL?.replace(/\/+$/, '')}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const {
        accessToken: newAccess,
        refreshToken: newRefresh,
        tokenType = 'Bearer',
        expiresInMs = 900000,
      } = resp.data || {};

      if (!newAccess) throw new Error('Invalid refresh response');

      // Store’u güncelle
      useAuthStore.getState().setAuth({
        accessToken: newAccess,
        refreshToken: newRefresh ?? refreshToken,
        tokenType,
        expiresInMs,
      });
      console.log('[API][REFRESH] success', { access: mask(newAccess) });

      // Kuyruğu çalıştır
      const cbs = queued;
      queued = [];
      cbs.forEach((cb) => cb());

      // Orijinal isteği tek seferlik retry
      (config.headers as any) = (config.headers as any) || {};
      (config.headers as any).Authorization = `${tokenType} ${newAccess}`;
      (config as any)._retry = true;
      return api(config);
    } catch (refreshError) {
      console.log('[API][REFRESH] failed');
      useAuthStore.getState().clearAuth();

      // Kuyruğu temizle (hepsi başarısız sayılacak)
      const cbs = queued;
      queued = [];
      cbs.forEach((cb) => cb());

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
