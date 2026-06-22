import * as ImagePicker from "expo-image-picker";

/**
 * Thin wrapper over expo-image-picker (native — needs the EAS build).
 *
 * Returns a single picked asset (or null if cancelled). Permission is requested
 * by the picker on first use (the prompt text comes from the app.json
 * expo-image-picker plugin config). `square` forces an editing crop — used for
 * the avatar (it also makes iOS hand back a JPEG, side-stepping HEIC).
 */

export type PickedAsset = { uri: string; mimeType: string | null; isVideo: boolean };

function firstAsset(res: ImagePicker.ImagePickerResult): PickedAsset | null {
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? null, isVideo: a.type === "video" };
}

/** Pick from the photo library. `allowVideo` adds videos; `square` crops (avatar). */
export async function pickFromLibrary(opts: { allowVideo?: boolean; square?: boolean } = {}): Promise<PickedAsset | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: opts.allowVideo ? ["images", "videos"] : ["images"],
    allowsEditing: !!opts.square,
    aspect: opts.square ? [1, 1] : undefined,
    quality: 0.8,
    videoMaxDuration: 60,
  });
  return firstAsset(res);
}

/** Take a new photo with the camera (single image). */
export async function takePhoto(opts: { square?: boolean } = {}): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing: !!opts.square,
    aspect: opts.square ? [1, 1] : undefined,
    quality: 0.8,
  });
  return firstAsset(res);
}
