import CryptoJS from "crypto-js";

/**
 * Generate a secure encryption key
 * Uses 256-bit key size for AES encryption
 */
const generateSecureKey = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

let cachedEncryptionKey: string | null = null;

/**
 * Get encryption key with fallback strategy:
 * 1. Use environment variable if set
 * 2. Use session storage if available
 * 3. Generate new secure key as last resort
 */
const getEncryptionKey = () => {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  if (process.env.NEXT_PUBLIC_ENCRYPTION_KEY) {
    cachedEncryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    return cachedEncryptionKey;
  }

  if (typeof window !== "undefined") {
    const sessionKey = sessionStorage.getItem("chatEncryptionKey");
    if (sessionKey) {
      cachedEncryptionKey = sessionKey;
      return cachedEncryptionKey;
    }
  }

  const newKey = generateSecureKey();
  cachedEncryptionKey = newKey;

  if (typeof window !== "undefined") {
    sessionStorage.setItem("chatEncryptionKey", newKey);
  }

  return cachedEncryptionKey;
};

if (
  typeof window !== "undefined" &&
  !sessionStorage.getItem("chatEncryptionKey")
) {
  sessionStorage.setItem("chatEncryptionKey", getEncryptionKey());
}

/**
 * Encrypts a message using AES-256 encryption
 * @param message - The plaintext message to encrypt
 * @returns The encrypted message as a base64 string
 */
export const encryptMessage = (message: string): string => {
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return message; // Fallback to unencrypted message in case of error
  }
};

/**
 * Decrypts an encrypted message
 * @param encryptedMessage - The encrypted message to decrypt
 * @returns The decrypted plaintext message
 */
export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      return encryptedMessage;
    }

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedMessage; // Return encrypted text if decryption fails
  }
};
