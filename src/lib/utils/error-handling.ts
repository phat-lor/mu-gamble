/**
 * Client-side error handling utilities
 */

import { toast } from 'svelte-sonner';

export interface ApiError {
	success: false;
	error: string;
	timestamp?: string;
	stack?: string;
}

export interface ApiSuccess<T> {
	success: true;
	result?: T;
	data?: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Handle API response and show appropriate user feedback
 */
export function handleApiResponse<T>(
	response: ApiResponse<T>,
	options: {
		successMessage?: string;
		showErrorToast?: boolean;
		onSuccess?: (data: T) => void;
		onError?: (error: string) => void;
	} = {}
): T | null {
	const { successMessage, showErrorToast = true, onSuccess, onError } = options;

	if (response.success) {
		const data = response.result || response.data;

		if (successMessage) {
			toast.success(successMessage);
		}

		if (onSuccess) {
			onSuccess(data);
		}

		return data || null;
	} else {
		const errorMessage = response.error || 'An unknown error occurred';

		if (showErrorToast) {
			toast.error(errorMessage);
		}

		if (onError) {
			onError(errorMessage);
		}

		return null;
	}
}

/**
 * Centralized API call wrapper with error handling
 */
export async function apiCall<T>(
	url: string,
	options: RequestInit = {},
	errorOptions: {
		showErrorToast?: boolean;
		onError?: (error: string) => void;
	} = {}
): Promise<ApiResponse<T>> {
	try {
		// Add CSRF token for state-changing requests
		if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
			const csrfToken = await getCSRFToken();
			if (csrfToken) {
				options.headers = {
					...options.headers,
					'X-CSRF-Token': csrfToken
				};
			}
		}

		// Ensure Content-Type is set for JSON requests
		if (options.body && options.headers) {
			const headers = options.headers as Record<string, string>;
			if (!headers['Content-Type'] && !headers['content-type']) {
				options.headers = {
					...options.headers,
					'Content-Type': 'application/json'
				};
			}
		}

		const response = await fetch(url, options);
		const data: ApiResponse<T> = await response.json();

		// Handle rate limiting
		if (response.status === 429) {
			const retryAfter = response.headers.get('X-RateLimit-Reset');
			const retryMessage = retryAfter
				? `Rate limited. Try again after ${new Date(parseInt(retryAfter) * 1000).toLocaleTimeString()}`
				: 'Rate limited. Please try again later.';

			return {
				success: false,
				error: retryMessage
			};
		}

		return data;
	} catch (error) {
		console.error('API call failed:', error);

		const errorMessage = error instanceof Error ? error.message : 'Network error occurred';

		if (errorOptions.showErrorToast !== false) {
			toast.error(errorMessage);
		}

		if (errorOptions.onError) {
			errorOptions.onError(errorMessage);
		}

		return {
			success: false,
			error: errorMessage
		};
	}
}

// Cache for CSRF token
let cachedCSRFToken: string | null = null;

/**
 * Get CSRF token from server API
 */
async function fetchCSRFToken(): Promise<string | null> {
	try {
		const response = await fetch('/api/csrf');
		const data = await response.json();
		return data.success ? data.token : null;
	} catch {
		return null;
	}
}

/**
 * Get CSRF token (cached or fetch new one)
 */
async function getCSRFToken(): Promise<string | null> {
	if (!cachedCSRFToken) {
		cachedCSRFToken = await fetchCSRFToken();
	}
	return cachedCSRFToken;
}

/**
 * Validation helpers for client-side input validation
 */
export const validation = {
	/**
	 * Validate bet amount
	 */
	betAmount(amount: number, balance: number): { valid: boolean; error?: string } {
		if (typeof amount !== 'number' || isNaN(amount)) {
			return { valid: false, error: 'Amount must be a valid number' };
		}

		if (amount <= 0) {
			return { valid: false, error: 'Amount must be greater than 0' };
		}

		if (amount > balance) {
			return { valid: false, error: 'Insufficient balance' };
		}

		return { valid: true };
	},

	/**
	 * Validate username
	 */
	username(username: string): { valid: boolean; error?: string } {
		if (typeof username !== 'string') {
			return { valid: false, error: 'Username must be a string' };
		}

		if (username.length < 3 || username.length > 31) {
			return { valid: false, error: 'Username must be 3-31 characters long' };
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			return {
				valid: false,
				error: 'Username can only contain letters, numbers, underscore, and dash'
			};
		}

		return { valid: true };
	},

	/**
	 * Validate password
	 */
	password(password: string): { valid: boolean; error?: string } {
		if (typeof password !== 'string') {
			return { valid: false, error: 'Password must be a string' };
		}

		if (password.length < 6) {
			return { valid: false, error: 'Password must be at least 6 characters long' };
		}

		if (password.length > 255) {
			return { valid: false, error: 'Password is too long' };
		}

		return { valid: true };
	}
};

/**
 * Debounce function for input validation
 */
export function debounce<T extends unknown[]>(
	func: (...args: T) => void,
	wait: number
): (...args: T) => void {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: T) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
