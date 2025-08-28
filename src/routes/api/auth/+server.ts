import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const { action, username, password } = await event.request.json();

	if (!validateUsername(username)) {
		return json(
			{
				success: false,
				message:
					'Invalid username (3-31 characters, letters, numbers, underscore, and dash only, case-insensitive)'
			},
			{ status: 400 }
		);
	}
	if (!validatePassword(password)) {
		return json(
			{ success: false, message: 'Invalid password (min 6, max 255 characters)' },
			{ status: 400 }
		);
	}

	if (action === 'login') {
		return handleLogin(event, username, password);
	} else if (action === 'register') {
		return handleRegister(event, username, password);
	}

	return json({ success: false, message: 'Invalid action' }, { status: 400 });
};

async function handleLogin(event: RequestEvent, username: string, password: string) {
	const results = await db
		.select()
		.from(table.user)
		.where(eq(table.user.username, username.toLowerCase()));

	const existingUser = results.at(0);
	if (!existingUser) {
		return json({ success: false, message: 'Incorrect username or password' }, { status: 400 });
	}

	const validPassword = await verify(existingUser.passwordHash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		return json({ success: false, message: 'Incorrect username or password' }, { status: 400 });
	}

	const sessionToken = auth.generateSessionToken();
	const ipAddress = event.getClientAddress();
	const userAgent = event.request.headers.get('user-agent') ?? undefined;
	const session = await auth.createSession(sessionToken, existingUser.id, ipAddress, userAgent);
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return json({ success: true, message: 'Login successful' });
}

async function handleRegister(event: RequestEvent, username: string, password: string) {
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

		return json({ success: true, message: 'Registration successful' });
	} catch (error) {
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return json({ success: false, message: 'Username already exists' }, { status: 400 });
		}
		return json({ success: false, message: 'An error has occurred' }, { status: 500 });
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
