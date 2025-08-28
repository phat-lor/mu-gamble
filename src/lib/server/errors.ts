/**
 * Centralized error handling and logging system
 */

import { json } from '@sveltejs/kit';
import { isDevelopment } from './env';

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;
	public readonly timestamp: Date;

	constructor(
		message: string,
		statusCode: number = 500,
		isOperational: boolean = true
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.timestamp = new Date();

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = 'Authentication required') {
		super(message, 401);
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = 'Access denied') {
		super(message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(message, 404);
	}
}

export class RateLimitError extends AppError {
	constructor(message: string = 'Rate limit exceeded') {
		super(message, 429);
	}
}

export class GameError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

/**
 * Central error handler for API endpoints
 */
export function handleError(error: unknown, headers?: Record<string, string>): Response {
	// Log the error
	logError(error);

	if (error instanceof AppError) {
		return json(
			{
				success: false,
				error: error.message,
				timestamp: error.timestamp.toISOString(),
				...(isDevelopment && { stack: error.stack })
			},
			{ 
				status: error.statusCode,
				headers
			}
		);
	}

	// Handle known error types
	if (error instanceof Error) {
		if (error.message === 'Insufficient balance') {
			return json(
				{ success: false, error: 'Insufficient balance' },
				{ status: 400, headers }
			);
		}

		if (error.message.includes('UNIQUE constraint failed')) {
			return json(
				{ success: false, error: 'Resource already exists' },
				{ status: 409, headers }
			);
		}

		if (error.message.includes('FOREIGN KEY constraint failed')) {
			return json(
				{ success: false, error: 'Invalid reference' },
				{ status: 400, headers }
			);
		}
	}

	// Generic error response
	return json(
		{
			success: false,
			error: isDevelopment ? String(error) : 'Internal server error',
			timestamp: new Date().toISOString()
		},
		{ 
			status: 500,
			headers
		}
	);
}

/**
 * Log errors appropriately based on environment
 */
function logError(error: unknown): void {
	const timestamp = new Date().toISOString();
	
	if (error instanceof AppError) {
		// Only log non-operational errors or in development
		if (!error.isOperational || isDevelopment) {
			console.error(`[${timestamp}] ${error.name}: ${error.message}`, {
				statusCode: error.statusCode,
				stack: error.stack,
				isOperational: error.isOperational
			});
		}
	} else {
		// Log all unexpected errors
		console.error(`[${timestamp}] Unexpected error:`, error);
	}
}

/**
 * Async error wrapper for API handlers
 */
export function asyncErrorHandler<T extends unknown[], R>(
	fn: (...args: T) => Promise<R>
) {
	return async (...args: T): Promise<R> => {
		try {
			return await fn(...args);
		} catch (error) {
			throw error instanceof AppError ? error : new AppError(String(error));
		}
	};
}

/**
 * Validate required fields and throw ValidationError if missing
 */
export function validateRequired<T extends Record<string, unknown>>(
	data: T,
	requiredFields: (keyof T)[]
): asserts data is T & Required<Pick<T, typeof requiredFields[number]>> {
	const missingFields = requiredFields.filter(field => 
		data[field] === undefined || data[field] === null || data[field] === ''
	);

	if (missingFields.length > 0) {
		throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
	}
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(message: string): string {
	// Remove sensitive patterns
	return message
		.replace(/password/gi, '[REDACTED]')
		.replace(/token/gi, '[REDACTED]')
		.replace(/secret/gi, '[REDACTED]')
		.replace(/key/gi, '[REDACTED]')
		.replace(/file:\/\/.*?:/g, '[PATH]:');
}
