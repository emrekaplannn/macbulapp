import api from '../lib/api';

export type MyAvatarResp = { path: string | null; url: string | null };

export async function uploadMyAvatar(file: {
  uri: string;
  name: string;           // ör: avatar.jpg
  type: string;           // image/jpeg | image/png
}): Promise<MyAvatarResp> {
  const form = new FormData();
  form.append('file', {
    // @ts-ignore RN FormData
    uri: file.uri,
    name: file.name,
    type: file.type,
  });

  const r = await api.post('/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data as MyAvatarResp;
}

export async function getMyAvatar() { // 30 gün
  const r = await api.get(`/profile/avatar`);
  return r.data as MyAvatarResp;
}
