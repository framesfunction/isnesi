/**
 * Constant-time string comparison to prevent timing side-channels when
 * comparing caller-provided secrets (webhook secrets, etc.) against
 * server-configured values.
 *
 * Always compares the full length of both inputs so the elapsed time does
 * not reveal how many leading characters matched.
 */

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still consume time proportionally to the longer input so length
    // itself is not an oracle.
    const longer = a.length > b.length ? a : b;
    let diff = longer.length;
    for (let i = 0; i < longer.length; i++) {
      const ca = i < a.length ? a.charCodeAt(i) : 0;
      const cb = i < b.length ? b.charCodeAt(i) : 0;
      diff |= ca ^ cb;
    }
    return diff === 0;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
