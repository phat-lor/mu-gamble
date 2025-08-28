/**
 * Rate limiting functionality to prevent abuse
 * Uses in-memory storage for simplicity, can be extended to use Redis for production
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

const store = new Map<string, RateLimitEntry>();

// Default rate limit configurations
export const RATE_LIMITS = {
	auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
	betting: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 bets per minute (1 per second)
	api: { windowMs: 60 * 1000, maxRequests: 100 } // 100 API calls per minute
} as const;

/**
 * Check if a request should be rate limited
 */
export function isRateLimited(
	identifier: string,
	config: RateLimitConfig
): { limited: boolean; resetTime?: number; remaining?: number } {
	const now = Date.now();
	const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;

	// Clean up expired entries periodically
	cleanupExpiredEntries();

	const entry = store.get(key);

	if (!entry || now > entry.resetTime) {
		// First request or window expired
		store.set(key, {
			count: 1,
			resetTime: now + config.windowMs
		});

		return {
			limited: false,
			remaining: config.maxRequests - 1,
			resetTime: now + config.windowMs
		};
	}

	if (entry.count >= config.maxRequests) {
		// Rate limit exceeded
		return {
			limited: true,
			resetTime: entry.resetTime,
			remaining: 0
		};
	}

	// Increment counter
	entry.count++;
	store.set(key, entry);

	return {
		limited: false,
		remaining: config.maxRequests - entry.count,
		resetTime: entry.resetTime
	};
}

/**
 * Create a rate limiter middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
	return (identifier: string) => isRateLimited(identifier, config);
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries() {
	const now = Date.now();

	// Clean up every 5 minutes to avoid overhead
	const lastCleanup = store.get('__last_cleanup__')?.resetTime || 0;
	if (now - lastCleanup < 5 * 60 * 1000) return;

	store.set('__last_cleanup__', { count: 0, resetTime: now });

	for (const [key, entry] of store.entries()) {
		if (key !== '__last_cleanup__' && now > entry.resetTime) {
			store.delete(key);
		}
	}
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(
	identifier: string,
	config: RateLimitConfig
): Record<string, string> {
	const result = isRateLimited(identifier, config);

	return {
		'X-RateLimit-Limit': config.maxRequests.toString(),
		'X-RateLimit-Remaining': (result.remaining || 0).toString(),
		'X-RateLimit-Reset': Math.ceil((result.resetTime || Date.now()) / 1000).toString()
	};
}
