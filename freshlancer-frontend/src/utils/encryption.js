import CryptoJS from 'crypto-js';

// IMPORTANT: In production, this key should be stored in environment variables
// and rotated regularly. Never commit the actual key to version control.
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secret-encryption-key-change-in-production-32chars!!';

// Ensure key is exactly 32 bytes for AES-256 (same as backend)
const getKey = () => {
  if (ENCRYPTION_KEY.length === 32) {
    return CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
  }
  // Hash the key to get exactly 32 bytes
  return CryptoJS.SHA256(ENCRYPTION_KEY);
};

/**
 * Encrypt data using AES-256-CBC (compatible with backend Node.js crypto)
 * @param {any} data - Data to encrypt (will be stringified if object)
 * @returns {string} Encrypted string in format: iv:encryptedData
 */
export const encryptData = (data) => {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);

    // Generate random IV (16 bytes for AES)
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(stringData, getKey(), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Return in format: iv:encryptedData (same as backend)
    return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-CBC (compatible with backend Node.js crypto)
 * @param {string} encryptedData - Encrypted string in format: iv:encryptedData
 * @param {boolean} parseJSON - Whether to parse the result as JSON (default: true)
 * @returns {any} Decrypted data
 */
export const decryptData = (encryptedData, parseJSON = true) => {
  try {
    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encrypted = CryptoJS.enc.Hex.parse(parts[1]);

    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encrypted },
      getKey(),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    return parseJSON ? JSON.parse(decryptedString) : decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt data for cookies (includes timestamp for expiry validation)
 * @param {any} data - Data to encrypt
 * @param {number} expiryHours - Hours until expiry (default: 24)
 * @returns {string} Encrypted string with timestamp
 */
export const encryptCookie = (data, expiryHours = 24) => {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryHours * 60 * 60 * 1000),
    };
    return encryptData(payload);
  } catch (error) {
    console.error('Cookie encryption error:', error);
    throw new Error('Failed to encrypt cookie data');
  }
};

/**
 * Decrypt cookie data and validate expiry
 * @param {string} encryptedData - Encrypted cookie string
 * @returns {any} Decrypted data or null if expired
 */
export const decryptCookie = (encryptedData) => {
  try {
    const payload = decryptData(encryptedData);

    // Check if expired
    if (payload.expiry && Date.now() > payload.expiry) {
      console.warn('Cookie data has expired');
      return null;
    }

    return payload.data;
  } catch (error) {
    console.error('Cookie decryption error:', error);
    return null;
  }
};

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 * Useful for verification without storing original data
 * @param {string} data - Data to hash
 * @returns {string} Hashed string
 */
export const hashData = (data) => {
  try {
    return CryptoJS.SHA256(data).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};

/**
 * Generate a random secure token
 * @param {number} length - Length of token (default: 32)
 * @returns {string} Random token
 */
export const generateToken = (length = 32) => {
  try {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    return CryptoJS.enc.Hex.stringify(randomBytes);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

export default {
  encryptData,
  decryptData,
  encryptCookie,
  decryptCookie,
  hashData,
  generateToken,
};
