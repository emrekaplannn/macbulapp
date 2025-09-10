import api from '../lib/api';

export type UserProfile = {
  userId: string;
  fullName: string | null;
  position: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export async function getUserProfile(): Promise<UserProfile> {
  const r = await api.get(`/user-profiles/me`);
  return r.data as UserProfile;
}

export async function updateUserProfile(
  patch: Partial<Pick<UserProfile, 'fullName' | 'position' | 'avatarUrl' | 'bio'>>
): Promise<UserProfile> {
  const r = await api.put(`/user-profiles/`, patch);
  return r.data as UserProfile;
}

// If you expose referral via its own table/endpoint:
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

    // backend sends array of referral codes
    const arr = r.data as ReferralCodeDto;

    // return first element if available, otherwise null
    return arr;
  } catch (e) {
    console.warn("Failed to fetch referral code", e);
    return null; // okay to be empty
  }
}

