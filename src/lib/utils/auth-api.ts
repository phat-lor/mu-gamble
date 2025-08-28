/**
 * Authentication API utilities
 */

import { apiCall, type ApiResponse } from './error-handling';

export interface AuthRequest {
	action: 'login' | 'register';
	username: string;
	password: string;
}

export interface AuthResponse {
	success: boolean;
	message: string;
}

/**
 * Authenticate user (login or register)
 */
export async function authenticate(request: AuthRequest): Promise<ApiResponse<AuthResponse>> {
	return apiCall<AuthResponse>('/api/auth', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<{ success: boolean }>> {
	return apiCall<{ success: boolean }>('/api/auth/logout', {
		method: 'POST'
	});
}
