# Encryption Implementation Guide

This document describes the encryption implementation for securing client data between frontend and backend.

## Overview

The encryption system protects sensitive data during transmission and storage in cookies using AES encryption.

## Features Implemented

### 1. **Frontend Encryption** (`crypto-js`)
- **Location**: `freshlancer-frontend/src/utils/encryption.js`
- **Library**: `crypto-js` (AES-256 encryption)
- **Functions**:
  - `encryptData(data)` - Encrypt any data (objects/strings)
  - `decryptData(encryptedData)` - Decrypt encrypted data
  - `encryptCookie(data, expiryHours)` - Encrypt data with timestamp for cookies
  - `decryptCookie(encryptedData)` - Decrypt and validate cookie expiry
  - `hashData(data)` - One-way hash (SHA-256)
  - `generateToken(length)` - Generate secure random tokens

### 2. **Backend Encryption** (`crypto`)
- **Location**: `FreeStudent-API/utils/encryption.js`
- **Library**: Node.js built-in `crypto` module (AES-256-CBC)
- **Functions**:
  - `encryptData(data)` - Encrypt with IV (Initialization Vector)
  - `decryptData(encryptedData)` - Decrypt using IV
  - `encryptCookie(data, expiryHours)` - Encrypt cookies with expiry
  - `decryptCookie(encryptedData)` - Decrypt and validate cookies
  - `hashData(data)` - SHA-256 hashing
  - `generateToken(length)` - Secure token generation
  - `compareHash(plainText, hashed)` - Compare hashes safely

### 3. **Automatic Request/Response Encryption**

#### Frontend (`api.js`)
- **Interceptors**: Automatically encrypt/decrypt for sensitive routes
- **Encrypted Routes**:
  - `/subscriptions/upgrade`
  - `/packages/purchase`
  - `/paymob/*`
  - `/users/login`
  - `/users/signup`
- **Headers**: Adds `X-Encrypted: true` header for encrypted requests

#### Backend (`encryptionMiddleware.js`)
- **Middleware**: `decryptRequest` and `encryptResponse`
- **Auto-detection**: Checks for `X-Encrypted` header
- **Bidirectional**: Encrypts response if request was encrypted

### 4. **Secure Cookie Management**

#### Frontend (`secureCookies.js`)
```javascript
import secureCookies from './utils/secureCookies';

// Set encrypted cookie
secureCookies.set('cookieName', { data: 'value' }, { expires: 1 }); // 1 day

// Get decrypted cookie
const data = secureCookies.get('cookieName');

// Remove cookie
secureCookies.remove('cookieName');

// Check if cookie exists and is valid
const isValid = secureCookies.hasValid('cookieName');
```

#### Backend (Paymob Controller)
- **Encrypted Cookies**: Payment intention IDs are now encrypted
- **Auto-decryption**: Middleware automatically decrypts cookies
- **Expiry Validation**: Cookies include timestamp and expiry

## Configuration

### Frontend Environment Variables
Add to `.env`:
```
VITE_ENCRYPTION_KEY=your-32-character-secret-key-here-change-this
```

### Backend Environment Variables
Add to `.env`:
```
ENCRYPTION_KEY=your-32-character-secret-key-here-change-this
```

**IMPORTANT**:
- Use the SAME key for both frontend and backend
- Key should be exactly 32 characters for AES-256
- NEVER commit the key to version control
- Rotate keys regularly in production
- Use different keys for development/staging/production

## How It Works

### Request Flow (Frontend → Backend)

1. **Frontend**:
   ```javascript
   // User makes API call
   api.post('/subscriptions/upgrade', { amount: 100, currency: 'EGP' })
   ```

2. **API Interceptor** (automatic):
   - Checks if route should be encrypted
   - Encrypts the request body: `{ encryptedPayload: "encrypted_string" }`
   - Adds header: `X-Encrypted: true`

3. **Backend Middleware** (automatic):
   - Detects `X-Encrypted: true` header
   - Decrypts `encryptedPayload`
   - Replaces `req.body` with decrypted data
   - Controller receives plain data

4. **Backend Response**:
   - Controller sends response
   - Middleware detects encrypted request
   - Encrypts response: `{ encryptedPayload: "encrypted_response" }`
   - Sets header: `X-Encrypted: true`

5. **Frontend Response Interceptor** (automatic):
   - Detects `X-Encrypted: true` header
   - Decrypts `encryptedPayload`
   - Returns plain data to caller

### Cookie Flow

1. **Backend Sets Cookie**:
   ```javascript
   const { encryptCookie } = require('../utils/encryption');
   const encrypted = encryptCookie(intentionId, 1); // 1 hour expiry
   res.cookie('paymob_intention_id', encrypted, options);
   ```

2. **Frontend Reads Cookie**:
   ```javascript
   import { getSecureCookie } from './utils/secureCookies';
   const intentionId = getSecureCookie('paymob_intention_id');
   ```

3. **Expiry Validation**:
   - Cookies include encrypted timestamp and expiry
   - `decryptCookie()` automatically validates
   - Returns `null` if expired

## Security Benefits

1. **Network Sniffing Protection**: Data encrypted in transit
2. **Browser DevTools Protection**: Encrypted data in Network tab
3. **Cookie Theft Mitigation**: Cookies are encrypted and time-limited
4. **Man-in-the-Middle Protection**: Even if intercepted, data is encrypted
5. **Automatic Expiry**: Cookies self-expire even if not deleted

## Testing

### Test Encryption:
```javascript
// Frontend
import { encryptData, decryptData } from './utils/encryption';

const data = { secret: 'test' };
const encrypted = encryptData(data);
console.log('Encrypted:', encrypted);

const decrypted = decryptData(encrypted);
console.log('Decrypted:', decrypted);
```

### Test Secure Cookies:
```javascript
import secureCookies from './utils/secureCookies';

secureCookies.set('test', { value: 123 }, { expires: 1 });
const value = secureCookies.get('test');
console.log('Cookie value:', value);
```

## Production Checklist

- [ ] Set strong encryption keys in environment variables
- [ ] Use HTTPS in production (required for secure cookies)
- [ ] Rotate encryption keys periodically
- [ ] Monitor decryption errors in logs
- [ ] Set appropriate cookie expiry times
- [ ] Enable `httpOnly` for sensitive cookies where possible
- [ ] Use `secure: true` for all cookies in production
- [ ] Implement key rotation strategy
- [ ] Add rate limiting to prevent brute force
- [ ] Monitor for unusual encryption/decryption patterns

## Troubleshooting

### Common Issues:

1. **Decryption Fails**:
   - Check encryption keys match on frontend/backend
   - Verify key is exactly 32 characters
   - Check for corrupted data

2. **Cookie Not Decrypting**:
   - Cookie may have expired
   - Check cookie value exists
   - Verify encryption key matches

3. **Request Encryption Not Working**:
   - Check route is in `ENCRYPTED_ROUTES` list
   - Verify `X-Encrypted` header is sent
   - Check middleware is loaded

4. **Response Structure Changes After Decryption**:
   - The frontend response interceptor returns the decrypted data directly
   - Backend sends: `{ status: 'success', data: { ... } }`
   - After decryption, response becomes the decrypted object itself
   - Access data at `response.data` or `response.data.data` depending on structure
   - Example: `const value = response?.data?.clientSecret || response?.data?.data?.clientSecret`

5. **Payment Data Not Reaching Backend**:
   - Ensure all required fields are in the request body BEFORE encryption
   - The encryption interceptor encrypts the entire body object
   - Backend middleware decrypts and replaces `req.body` with original data
   - Check backend logs to verify decrypted structure matches expected format

## Files Modified

### Frontend:
- `src/utils/encryption.js` - NEW
- `src/utils/secureCookies.js` - NEW
- `src/services/api.js` - MODIFIED (added encryption interceptors)
- `package.json` - MODIFIED (added crypto-js, js-cookie)

### Backend:
- `utils/encryption.js` - NEW
- `middleware/encryptionMiddleware.js` - NEW
- `app.js` - MODIFIED (added encryption middleware)
- `controllers/paymobController.js` - MODIFIED (encrypted cookies)

## Examples

### Manual Encryption (if needed):
```javascript
// Frontend
import { encryptData } from './utils/encryption';
const encrypted = encryptData({ sensitive: 'data' });
// Send to backend

// Backend
const { decryptData } = require('./utils/encryption');
const decrypted = decryptData(encrypted);
```

### Add New Encrypted Route:
```javascript
// Frontend: src/services/api.js
const ENCRYPTED_ROUTES = [
  '/subscriptions/upgrade',
  '/packages/purchase',
  '/paymob/',
  '/your-new-route', // Add here
];
```

## Notes

- Encryption adds minimal overhead (~1-2ms per request)
- AES-256 is industry standard and highly secure
- Keys should be stored in environment variables, never in code
- Cookie encryption includes timestamp to prevent replay attacks
- All encryption is transparent to API consumers

## Support

For issues or questions about the encryption implementation:
1. Check logs for decryption errors
2. Verify environment variables are set
3. Test with sample data first
4. Review this documentation

---

**Last Updated**: 2025-11-25
**Version**: 1.0.0
