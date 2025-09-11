// src/navigation/AuthGate.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../state/authStore';
import { API_BASE_URL } from '../lib/api'; // api.ts içinden export

type Props = { children: React.ReactNode };

export default function AuthGate({ children }: Props) {
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore();
  const [booting, setBooting] = useState(true);
  const refreshingRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    // Access varsa hemen geç
    if (accessToken) {
      setBooting(false);
      return () => { aliveRef.current = false; };
    }

    // Access yok, refresh de yoksa bekletme
    if (!refreshToken) {
      clearAuth();       // state’i netle
      setBooting(false);
      return () => { aliveRef.current = false; };
    }

    // Çift çağrıyı engelle
    if (refreshingRef.current) return () => { aliveRef.current = false; };
    refreshingRef.current = true;

    (async () => {
      try {
        if (!API_BASE_URL) {
          console.warn('[AuthGate] Missing API_BASE_URL; skipping refresh');
          clearAuth();
          return;
        }

        const url = `${API_BASE_URL.replace(/\/+$/, '')}/auth/refresh`;
        const res = await axios.post(
          url,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        if (!aliveRef.current) return;

        const {
          accessToken: newAccess,
          refreshToken: newRefresh,
          tokenType = 'Bearer',
          expiresInMs = 900_000,
        } = res.data || {};

        if (newAccess) {
          setAuth({
            accessToken: newAccess,
            refreshToken: newRefresh ?? refreshToken,
            tokenType,
            expiresInMs,
          });
        } else {
          clearAuth();
        }
      } catch (e) {
        // Refresh başarısız → login akışına düşeceğiz
        clearAuth();
      } finally {
        if (aliveRef.current) setBooting(false);
        refreshingRef.current = false;
      }
    })();

    return () => { aliveRef.current = false; };
  }, [accessToken, refreshToken, setAuth, clearAuth]);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0097A7' }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: '#fff', marginTop: 8, fontWeight: '700' }}>
          Oturum kontrol ediliyor…
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
