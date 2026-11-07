/**
 * Field-level encryption for safeguarding case notes.
 *
 * AES-256-GCM with a random 96-bit IV per note. The key is a base64-encoded
 * 256-bit key provided through function secrets (`SAFEGUARDING_ENCRYPTION_KEY`)
 * and never committed to the repository.
 */

function readKey(env: { get(key: string): string | undefined }): Uint8Array | null {
  const encoded = env.get("SAFEGUARDING_ENCRYPTION_KEY");
  if (!encoded) return null;
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}

/** Encrypt a note and return `base64(iv || ciphertext)`, or null when unconfigured. */
export function encryptNote(
  plaintext: string,
  env: { get(key: string): string | undefined },
): string | null {
  const keyBytes = readKey(env);
  if (!keyBytes) return null;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  return crypto.subtle
    .importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"])
    .then((key) =>
      crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
    )
    .then((ciphertext: ArrayBuffer) => {
      const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
      combined.set(new Uint8Array(iv), 0);
      combined.set(new Uint8Array(ciphertext), iv.byteLength);
      let binary = "";
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    })
    .catch(() => null);
}
