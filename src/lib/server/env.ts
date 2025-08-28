/**
 * Environment configuration with validation and defaults
 */

import { env } from '$env/dynamic/private';

interface EnvConfig {
	DATABASE_URL: string;
	NODE_ENV: string;
	SESSION_SECRET: string;
	CSRF_SECRET: string;
	ENABLE_RATE_LIMITING: boolean;
	MAX_LOGIN_ATTEMPTS: number;
	MAX_BET_ATTEMPTS: number;
	PUBLIC_SITE_URL: string;
	ADMIN_EMAIL?: string;
}

function validateAndParseEnv(): EnvConfig {
	// Required environment variables
	const DATABASE_URL = env.DATABASE_URL;
	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is required');
	}

	const NODE_ENV = env.NODE_ENV || 'development';
	
	// Security configuration
	const SESSION_SECRET = env.SESSION_SECRET;
	if (!SESSION_SECRET && NODE_ENV === 'production') {
		throw new Error('SESSION_SECRET is required in production');
	}

	const CSRF_SECRET = env.CSRF_SECRET;
	if (!CSRF_SECRET && NODE_ENV === 'production') {
		throw new Error('CSRF_SECRET is required in production');
	}

	// Rate limiting configuration
	const ENABLE_RATE_LIMITING = env.ENABLE_RATE_LIMITING === 'true' || NODE_ENV === 'production';
	const MAX_LOGIN_ATTEMPTS = parseInt(env.MAX_LOGIN_ATTEMPTS || '5', 10);
	const MAX_BET_ATTEMPTS = parseInt(env.MAX_BET_ATTEMPTS || '10', 10);

	// Site configuration
	const PUBLIC_SITE_URL = env.PUBLIC_SITE_URL || 'http://localhost:5173';

	// Optional configuration
	const ADMIN_EMAIL = env.ADMIN_EMAIL;

	return {
		DATABASE_URL,
		NODE_ENV,
		SESSION_SECRET: SESSION_SECRET || 'dev-session-secret-change-in-production',
		CSRF_SECRET: CSRF_SECRET || 'dev-csrf-secret-change-in-production',
		ENABLE_RATE_LIMITING,
		MAX_LOGIN_ATTEMPTS,
		MAX_BET_ATTEMPTS,
		PUBLIC_SITE_URL,
		ADMIN_EMAIL
	};
}

// Export the validated configuration
export const config = validateAndParseEnv();

// Export individual values for convenience
export const {
	DATABASE_URL,
	NODE_ENV,
	SESSION_SECRET,
	CSRF_SECRET,
	ENABLE_RATE_LIMITING,
	MAX_LOGIN_ATTEMPTS,
	MAX_BET_ATTEMPTS,
	PUBLIC_SITE_URL,
	ADMIN_EMAIL
} = config;

// Helper functions
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';
