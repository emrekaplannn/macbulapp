import api from './client';

export type UserProfile = {
  userId: string;
  fullName: string | null;
  position: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const r = await api.get(`/user-profiles/${userId}`);
  return r.data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'fullName' | 'position' | 'avatarUrl' | 'bio'>>
): Promise<UserProfile> {
  const r = await api.put(`/user-profiles/${userId}`, patch);
  return r.data as UserProfile;
}

// If you expose referral via its own table/endpoint:
// If you expose referral via its own table/endpoint:
export type ReferralCodeDto = {
  id: string;
  userId: string;
  code: string;
  createdAt: number;
};

export async function getReferralCode(userId: string): Promise<ReferralCodeDto | null> {
  try {
    const r = await api.get(`/referral-codes/user/${userId}`);

    // backend sends array of referral codes
    const arr = r.data as ReferralCodeDto[];

    // return first element if available, otherwise null
    return arr.length > 0 ? arr[0] : null;
  } catch (e) {
    console.warn("Failed to fetch referral code", e);
    return null; // okay to be empty
  }
}

