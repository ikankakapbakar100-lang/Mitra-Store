/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Crypto API helper for military-grade AES-GCM 256-bit encryption

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compute SHA-256 checksum string of data
export async function computeSha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES-GCM 256-bit key from passphrase and salt using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  algorithm: 'AES-GCM-256';
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  checksum: string; // SHA-256 of plain JSON
  timestamp: string;
  version: string;
}

/**
 * Encrypt a plain object or string using AES-GCM 256
 */
export async function encryptData(data: unknown, passphrase: string): Promise<EncryptedPayload> {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const checksum = await computeSha256(jsonString);

  // Generate random 16-byte salt and 12-byte IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(jsonString);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedPlaintext
  );

  return {
    algorithm: 'AES-GCM-256',
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
    checksum: checksum,
    timestamp: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Decrypt an AES-GCM 256 encrypted payload using passphrase
 */
export async function decryptData<T = unknown>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  if (payload.algorithm !== 'AES-GCM-256') {
    throw new Error('Algoritma enkripsi tidak didukung: ' + payload.algorithm);
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);

    // Verify SHA-256 checksum integrity
    const computedChecksum = await computeSha256(jsonString);
    if (computedChecksum !== payload.checksum) {
      throw new Error('Checksum integrity verification failed: Data corrupted or altered');
    }

    return JSON.parse(jsonString) as T;
  } catch (err) {
    throw new Error('Gagal mendekripsi data. Password salah atau file backup rusak: ' + (err instanceof Error ? err.message : String(err)));
  }
}
