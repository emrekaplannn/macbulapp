// api.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../state/authStore';
import Config from 'react-native-config';

export const API_BASE_URL = Config.API_URL; // e.g. http://10.0.2.2:8080/v1

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ---------- helpers ----------
function joinUrl(baseURL?: string, url?: string) {
  const b = baseURL || '';
  const u = url || '';
  if (!b) return u;
  if (!u) return b;
  return u.startsWith('http') ? u : `${b.replace(/\/+$/, '')}/${u.replace(/^\/+/, '')}`;
}

// Treat any /auth/... path as an auth endpoint
function isAuthRequest(config: AxiosRequestConfig) {
  const full = joinUrl(config.baseURL as string, config.url as string);
  return full.includes('/auth/');
}

// JWT decode helper (payload kısmını base64 decode et)
function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  // headers'i her durumda initialize et
  config.headers = config.headers || {};
  config.headers['Content-Type'] = 'application/json';
  config.headers['Accept'] = 'application/json';

  const full = joinUrl(config.baseURL as string, config.url as string);
  const method = (config.method || 'get').toUpperCase();

  // Auth endpointleri hariç token ekle
  if (method !== 'OPTIONS' && !isAuthRequest(config)) {
    const { accessToken, tokenType } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `${tokenType ?? 'Bearer'} ${accessToken}`;
    }
  }

  // ---- DEBUG ----
  console.log('[API][REQ]', method, full);
  console.log('[API][REQ][HEADERS]', config.headers);

  return config;
});


// ---------- RESPONSE + REFRESH FLOW ----------
let isRefreshing = false;
let queued: Array<() => void> = [];

api.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('[API][RES]', res.status, joinUrl(res.config?.baseURL as string, res.config?.url as string));
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

    // Only handle 401 here
    if (!response || status !== 401 || (config as any)?._retry) {
      return Promise.reject(err);
    }
    if (isAuthRequest(config)) {
      return Promise.reject(err);
    }

    const { refreshToken } = useAuthStore.getState();
    
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(err);
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const {
          accessToken,
          refreshToken: newRefreshToken,
          tokenType = 'Bearer',
          expiresInMs = 900_000,
        } = res.data || {};

        if (!accessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response');
        }

        useAuthStore.getState().setAuth({
          accessToken,
          refreshToken: newRefreshToken,
          tokenType,
          expiresInMs,
        });

        // Retry failed requests
        config.headers['Authorization'] = `${tokenType} ${accessToken}`;
        (config as any)._retry = true;

        // Process queued requests
        queued.forEach((cb) => cb());
        queued = [];

        return api(config);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        queued.forEach((cb) => cb());
        queued = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Queue the request if refresh is in progress
    return new Promise((resolve) => {
      queued.push(() => {
        const { accessToken, tokenType } = useAuthStore.getState();
        if (accessToken) {
          config.headers['Authorization'] = `${tokenType} ${accessToken}`;
          (config as any)._retry = true;
          resolve(api(config));
        } else {
          resolve(Promise.reject(err));
        }
      });
    });
    if (!refreshToken) return Promise.reject(err);

    const doRetry = () => {
      (config as any)._retry = true;
      console.log('[API][RETRY]', joinUrl(config?.baseURL, config?.url));
      return api(config);
    };

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queued.push(() => doRetry().then(resolve).catch(reject));
      });
    }

    try {
      isRefreshing = true;
      console.log('[API][REFRESH] start');

      const resp = await axios.post(
        `${API_BASE_URL?.replace(/\/+$/, '')}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const { accessToken: newAccess, refreshToken: newRefresh, tokenType, expiresInMs } = resp.data || {};
      useAuthStore.getState().setAuth({
        accessToken: newAccess,
        refreshToken: newRefresh ?? refreshToken,
        tokenType: tokenType ?? 'Bearer',
        expiresInMs: expiresInMs ?? 900000,
      });
      console.log('[API][REFRESH] success');

      queued.forEach((fn) => fn());
      queued = [];
      return doRetry();
    } catch (e) {
      console.log('[API][REFRESH] failed');
      useAuthStore.getState().clearAuth();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
