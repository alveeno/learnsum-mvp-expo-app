import { FileSystemUploadType, uploadAsync } from "expo-file-system/legacy";

import { apiFetch } from "./client";

/**
 * Media upload via the backend's signed-upload flow (no Supabase SDK in the app).
 *
 *   1. POST /api/upload { kind, content_type } → a short-lived SIGNED upload URL
 *      under the caller's own "{uid}/{avatars|posts}/..." path + the public URL.
 *   2. PUT the file bytes straight to Storage at that signed URL
 *      (expo-file-system `uploadAsync`, binary body).
 *
 * Returns the PUBLIC url to store on the post/profile. The backend validates a
 * post's media url is under the caller's own prefix, so this public_url is
 * exactly what `createPost`/`patchProfileMe` should save.
 *
 * Note: content_type must be one the backend allows (jpeg/png/webp/gif, mp4/mov/
 * webm). The iOS Simulator yields jpeg/png/mp4; a real device's HEIC photos would
 * need conversion (expo-image-manipulator) — a follow-up to avoid a 2nd rebuild.
 */

export type UploadKind = "avatar" | "post";

interface SignedUpload {
  bucket: string;
  path: string;
  token: string;
  signed_url: string;
  public_url: string;
  content_type: string;
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};
const ALLOWED = new Set(Object.values(EXT_TO_MIME));

/** Resolve a content type the backend accepts from the asset's mime / extension. */
function resolveContentType(uri: string, mimeType: string | null | undefined, isVideo: boolean): string {
  if (mimeType && ALLOWED.has(mimeType)) return mimeType;
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  return isVideo ? "video/mp4" : "image/jpeg";
}

/** Upload a picked file and return its public URL + the media kind. */
export async function uploadFile(
  kind: UploadKind,
  file: { uri: string; mimeType?: string | null; isVideo?: boolean },
): Promise<{ publicUrl: string; mediaType: "image" | "video" }> {
  const content_type = resolveContentType(file.uri, file.mimeType, !!file.isVideo);
  const signed = await apiFetch<SignedUpload>("/api/upload", {
    method: "POST",
    body: { kind, content_type },
  });
  const res = await uploadAsync(signed.signed_url, file.uri, {
    httpMethod: "PUT",
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { "content-type": content_type, "x-upsert": "true" },
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upload failed (${res.status})`);
  }
  return { publicUrl: signed.public_url, mediaType: content_type.startsWith("video") ? "video" : "image" };
}
