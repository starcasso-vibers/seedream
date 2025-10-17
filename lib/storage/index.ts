/**
 * Storage Backend Auto-Selection
 * Automatically selects the appropriate storage adapter based on available environment variables
 */

import { StorageAdapter } from './adapter';
import { LocalStorageAdapter } from './local-adapter';
import { RedisStorageAdapter } from './redis-adapter';

/**
 * Auto-select storage backend based on environment variables:
 * Priority 1: Redis + Vercel Blob (REDIS_URL + BLOB_READ_WRITE_TOKEN)
 * Priority 2: Local filesystem (fallback for development)
 */
export const storage: StorageAdapter = (() => {
  // Priority 1: Redis with Vercel Blob (current environment)
  if (process.env.REDIS_URL) {
    console.log('🔴 Using Redis Storage + Vercel Blob');
    return new RedisStorageAdapter();
  }

  // Priority 2: Local filesystem (fallback)
  console.log('📁 Using Local Filesystem Storage');
  return new LocalStorageAdapter();
})();
