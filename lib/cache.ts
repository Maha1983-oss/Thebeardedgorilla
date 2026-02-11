/**
 * LocalStorage Cache Utility
 * Provides client-side caching for CSV data to reduce API calls
 */

const CACHE_PREFIX = "csv_cache_";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data from localStorage
 * Returns null if cache is expired or doesn't exist
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null; // Server-side check

  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp }: CacheEntry<T> = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

/**
 * Set data in localStorage cache
 * Gracefully handles quota exceeded errors for large datasets
 */
export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return; // Server-side check

  try {
    const cacheKey = CACHE_PREFIX + key;
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    const serialized = JSON.stringify(cacheEntry);
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);

    // Check if data is too large (> 4 MB)
    if (sizeInMB > 4) {
      console.warn(
        `⚠️ Cache data for '${key}' is too large (${sizeInMB.toFixed(
          2
        )} MB) for localStorage. Skipping localStorage cache, using memory cache only.`
      );
      return;
    }

    localStorage.setItem(cacheKey, serialized);
    console.log(
      `✅ Cached '${key}' in localStorage (${sizeInMB.toFixed(2)} MB)`
    );
  } catch (error: any) {
    // Handle QuotaExceededError gracefully
    if (error.name === "QuotaExceededError" || error.code === 22) {
      console.warn(
        `⚠️ localStorage quota exceeded. Clearing old caches and skipping localStorage for '${key}'. React Query memory cache will still work.`
      );
      // Try to clear old caches to free up space
      clearExpiredCaches();
      // Don't retry - just use memory cache
    } else {
      console.error("Error writing to cache:", error);
    }
  }
}

/**
 * Clear a specific cache entry
 */
export function clearCache(key: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Clear all expired caches
 */
export function clearExpiredCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp }: CacheEntry<any> = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_EXPIRY) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing expired caches:", error);
  }
}

/**
 * Clear all CSV caches
 */
export function clearAllCSVCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing all caches:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  if (typeof window === "undefined") return null;

  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(CACHE_PREFIX)
    );
    const validCaches = keys.filter((key) => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return false;
        const { timestamp }: CacheEntry<any> = JSON.parse(cached);
        return Date.now() - timestamp <= CACHE_EXPIRY;
      } catch {
        return false;
      }
    });

    return {
      totalCaches: keys.length,
      validCaches: validCaches.length,
      expiredCaches: keys.length - validCaches.length,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return null;
  }
}
