/**
 * CSRF Protection Implementation
 * Provides double-submit cookie pattern for CSRF protection
 */

import { createHash } from 'crypto';
import type { RequestEvent } from '@sveltejs/kit';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(CSRF_TOKEN_LENGTH));
	return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFCookie(event: RequestEvent, token: string): void {
	event.cookies.set(CSRF_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		maxAge: 60 * 60 * 24 // 24 hours
	});
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(event: RequestEvent): string | null {
	return event.cookies.get(CSRF_COOKIE_NAME) || null;
}

/**
 * Validate CSRF token using double-submit cookie pattern
 */
export function validateCSRFToken(event: RequestEvent): boolean {
	// Skip CSRF validation for GET, HEAD, OPTIONS requests
	if (['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
		return true;
	}

	const cookieToken = getCSRFTokenFromCookie(event);
	const headerToken = event.request.headers.get('X-CSRF-Token') || 
					   event.request.headers.get('x-csrf-token');

	if (!cookieToken || !headerToken) {
		return false;
	}

	// Use constant-time comparison to prevent timing attacks
	return constantTimeEqual(cookieToken, headerToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Middleware to handle CSRF protection
 */
export function handleCSRF(event: RequestEvent): boolean {
	// Generate token if not present
	let token = getCSRFTokenFromCookie(event);
	if (!token) {
		token = generateCSRFToken();
		setCSRFCookie(event, token);
	}

	// Validate token for state-changing requests
	return validateCSRFToken(event);
}

/**
 * Get CSRF token for client-side use
 */
export function getCSRFTokenForClient(event: RequestEvent): string {
	let token = getCSRFTokenFromCookie(event);
	if (!token) {
		token = generateCSRFToken();
		setCSRFCookie(event, token);
	}
	return token;
}
