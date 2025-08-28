import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { isRateLimited, RATE_LIMITS, getRateLimitHeaders } from '$lib/server/rate-limiter';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	// Origin validation for auth endpoints (alternative to CSRF for public endpoints)
	const origin = event.request.headers.get('origin');
	const host = event.request.headers.get('host');

	// Allow same-origin requests and localhost in development
	const isDev = process.env.NODE_ENV === 'development';
	const allowedOrigins = isDev
		? [`http://${host}`, `https://${host}`, 'http://localhost:5173']
		: [`https://${host}`];

	if (origin && !allowedOrigins.includes(origin)) {
		return json({ success: false, message: 'Invalid origin' }, { status: 403 });
	}

	// Rate Limiting
	const clientIP = event.getClientAddress();
	const rateLimitResult = isRateLimited(clientIP, RATE_LIMITS.auth);
	const headers = getRateLimitHeaders(clientIP, RATE_LIMITS.auth);

	if (rateLimitResult.limited) {
		return json(
			{ success: false, message: 'Too many attempts. Please try again later.' },
			{ status: 429, headers }
		);
	}

	let requestData;
	try {
		requestData = await event.request.json();
	} catch {
		return json({ success: false, message: 'Invalid request body' }, { status: 400, headers });
	}

	const { action, username, password } = requestData;

	if (!validateUsername(username)) {
		return json(
			{
				success: false,
				message:
					'Invalid username (3-31 characters, letters, numbers, underscore, and dash only, case-insensitive)'
			},
			{ status: 400, headers }
		);
	}
	if (!validatePassword(password)) {
		return json(
			{ success: false, message: 'Invalid password (min 6, max 255 characters)' },
			{ status: 400, headers }
		);
	}

	if (action === 'login') {
		return handleLogin(event, username, password, headers);
	} else if (action === 'register') {
		return handleRegister(event, username, password, headers);
	}

	return json({ success: false, message: 'Invalid action' }, { status: 400, headers });
};

async function handleLogin(
	event: RequestEvent,
	username: string,
	password: string,
	headers: Record<string, string>
) {
	const results = await db
		.select()
		.from(table.user)
		.where(eq(table.user.username, username.toLowerCase()));

	const existingUser = results.at(0);
	if (!existingUser) {
		// Add delay to prevent username enumeration timing attacks
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return json(
			{ success: false, message: 'Incorrect username or password' },
			{ status: 400, headers }
		);
	}

	const validPassword = await verify(existingUser.passwordHash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		return json(
			{ success: false, message: 'Incorrect username or password' },
			{ status: 400, headers }
		);
	}

	const sessionToken = auth.generateSessionToken();
	const ipAddress = event.getClientAddress();
	const userAgent = event.request.headers.get('user-agent') ?? undefined;
	const session = await auth.createSession(sessionToken, existingUser.id, ipAddress, userAgent);
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return json({ success: true, message: 'Login successful' }, { headers });
}

async function handleRegister(
	event: RequestEvent,
	username: string,
	password: string,
	headers: Record<string, string>
) {
	const userId = generateUserId();
	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	try {
		await db
			.insert(table.user)
			.values({ id: userId, username: username.toLowerCase(), passwordHash });

		const sessionToken = auth.generateSessionToken();
		const ipAddress = event.getClientAddress();
		const userAgent = event.request.headers.get('user-agent') ?? undefined;
		const session = await auth.createSession(sessionToken, userId, ipAddress, userAgent);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return json({ success: true, message: 'Registration successful' }, { headers });
	} catch (error) {
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return json({ success: false, message: 'Username already exists' }, { status: 400, headers });
		}
		console.error('Registration error:', error);
		return json({ success: false, message: 'An error has occurred' }, { status: 500, headers });
	}
}

function generateUserId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-zA-Z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
