import Cookies from 'js-cookie';
import { encryptCookie, decryptCookie } from './encryption';

/**
 * Set an encrypted cookie
 * @param {string} name - Cookie name
 * @param {any} value - Cookie value (will be encrypted)
 * @param {object} options - Cookie options (expires, path, etc.)
 */
export const setSecureCookie = (name, value, options = {}) => {
  try {
    const expiryHours = options.expires ? options.expires * 24 : 24; // Convert days to hours
    const encryptedValue = encryptCookie(value, expiryHours);

    Cookies.set(name, encryptedValue, {
      secure: true, // Only send over HTTPS in production
      sameSite: 'strict', // CSRF protection
      ...options,
    });

    return true;
  } catch (error) {
    console.error('Failed to set secure cookie:', error);
    return false;
  }
};

/**
 * Get and decrypt a cookie
 * @param {string} name - Cookie name
 * @returns {any} Decrypted cookie value or null
 */
export const getSecureCookie = (name) => {
  try {
    const encryptedValue = Cookies.get(name);
    if (!encryptedValue) {
      return null;
    }

    const decryptedValue = decryptCookie(encryptedValue);
    return decryptedValue;
  } catch (error) {
    console.error('Failed to get secure cookie:', error);
    return null;
  }
};

/**
 * Remove a cookie
 * @param {string} name - Cookie name
 * @param {object} options - Cookie options (path, domain, etc.)
 */
export const removeSecureCookie = (name, options = {}) => {
  try {
    Cookies.remove(name, options);
    return true;
  } catch (error) {
    console.error('Failed to remove secure cookie:', error);
    return false;
  }
};

/**
 * Check if a secure cookie exists and is valid
 * @param {string} name - Cookie name
 * @returns {boolean} True if cookie exists and is valid
 */
export const hasValidSecureCookie = (name) => {
  try {
    const value = getSecureCookie(name);
    return value !== null;
  } catch (error) {
    return false;
  }
};

export default {
  set: setSecureCookie,
  get: getSecureCookie,
  remove: removeSecureCookie,
  hasValid: hasValidSecureCookie,
};
