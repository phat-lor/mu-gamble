import * as auth from '$lib/server/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.session) {
		return json({ success: false, message: 'Not authenticated' }, { status: 401 });
	}

	await auth.invalidateSession(event.locals.session.id);
	auth.deleteSessionTokenCookie(event);

	return json({ success: true, message: 'Logout successful' });
};
