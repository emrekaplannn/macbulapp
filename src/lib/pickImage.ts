import {launchImageLibrary} from 'react-native-image-picker';

export async function pickImage() {
  const res = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: false,
  });

  if (res.didCancel || !res.assets || !res.assets[0]) return null;

  const a = res.assets[0];
  const name =
    a.fileName ??
    `avatar_${Date.now()}.${(a.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;

  return {
    uri: a.uri!,
    name,
    type: a.type || 'image/jpeg',
  };
}
