/**
 * Hashes a plaintext password using SHA-256 via the Web Crypto API.
 * If the input password is already a 64-character hexadecimal SHA-256 hash,
 * it returns it as-is to prevent double-hashing.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  
  // Check if it's already a SHA-256 hash (64-character hex string)
  if (/^[a-f0-9]{64}$/i.test(password)) {
    return password;
  }
  
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
