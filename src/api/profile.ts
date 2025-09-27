import api from '../lib/api';

/** Backend artık URL değil PATH saklıyor.  */
export type UserProfile = {
  userId: string;
  fullName: string | null;
  position: string | null;
  avatarPath: string | null;   // <— yeni alan
  bio: string | null;

  avatarUrl?: string | null; // <— geçici uyumluluk alanı
};

export async function getUserProfile(): Promise<UserProfile> {
  const r = await api.get(`/user-profiles/me`);
  return r.data as UserProfile;
}

/** Artık avatar alanlarını PATCH etmiyoruz; sadece metinsel alanlar. */
export async function updateUserProfile(
  patch: Partial<Pick<UserProfile, 'fullName' | 'position' | 'bio'>>
): Promise<UserProfile> {
  const r = await api.put(`/user-profiles/`, patch);
  return r.data as UserProfile;
}

/** Referral */
export type ReferralCodeStatus = 'ACTIVE' | 'INACTIVE';
export type ReferralCodeDto = {
  id: string;
  userId: string;
  code: string;
  status: ReferralCodeStatus;
  createdAt: number;
};

export async function getReferralCode(): Promise<ReferralCodeDto | null> {
  try {
    const r = await api.get(`/referral-codes/user-actives`);
    return r.data as ReferralCodeDto;
  } catch (e) {
    console.warn('Failed to fetch referral code', e);
    return null;
  }
}

/** ------- Avatar API ------- */
export type AvatarResponse = { path: string; url: string };

/** Mevcut avatar için kısa süreli signed URL döner. */
export async function getMyAvatar(ttlSeconds: number = 3600): Promise<AvatarResponse> {
  const r = await api.get(`/profile/avatar`, { params: { ttl: ttlSeconds } });
  return r.data as AvatarResponse;
}

/**
 * RN’de foto yüklemek için FormData kullanıyoruz.
 * `file` -> { uri: string; name?: string; type?: string }
 *  - uri: ImagePicker/Camera’dan gelen local uri (file://… veya content://…)
 *  - name: opsiyonel (RN axios kendisi boundary ve filename ayarlayabiliyor ama vermek iyi olur)
 *  - type: 'image/jpeg' | 'image/png' | …
 */
export async function uploadMyAvatar(file: { uri: string; name?: string; type?: string }): Promise<AvatarResponse> {
  const data = new FormData();
  data.append('file', {
    // @ts-ignore - React Native FormData
    uri: file.uri,
    name: file.name ?? 'avatar.jpg',
    type: file.type ?? 'image/jpeg',
  });

  const r = await api.post(`/profile/avatar`, data); // ✅ header elleme
  return r.data as AvatarResponse;
}

