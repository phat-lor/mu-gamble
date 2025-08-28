import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCSRFTokenForClient } from '$lib/server/csrf';

export const GET: RequestHandler = async (event) => {
	const token = getCSRFTokenForClient(event);

	return json({
		success: true,
		token
	});
};
