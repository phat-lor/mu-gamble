import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import {
	verifyGameResult,
	verifyServerSeed,
	generateDiceRoll,
	generateCoinFlip
} from '$lib/server/provably-fair';

// GET endpoint for verifying a specific bet
export const GET: RequestHandler = async (event) => {
	try {
		const sessionToken = auth.getSessionToken(event);
		if (!sessionToken) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { session, user } = await auth.validateSessionToken(sessionToken);
		if (!session || !user) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		// Get bet ID from query parameters
		const url = new URL(event.request.url);
		const betId = url.searchParams.get('betId');

		if (!betId) {
			return json({ success: false, error: 'Bet ID is required' }, { status: 400 });
		}

		// Get bet data
		const bets = await db
			.select()
			.from(table.bet)
			.where(and(eq(table.bet.id, betId), eq(table.bet.userId, user.id)));

		if (bets.length === 0) {
			return json({ success: false, error: 'Bet not found' }, { status: 404 });
		}

		const bet = bets[0];

		// Verify server seed hash
		const seedHashValid = verifyServerSeed(bet.serverSeed, bet.serverSeedHash);

		// Calculate expected result based on game type
		let calculatedResult: number;
		if (bet.gameType === 'dice') {
			calculatedResult = generateDiceRoll(bet.serverSeed, bet.clientSeed, bet.nonce);
		} else if (bet.gameType === 'flip') {
			calculatedResult = generateCoinFlip(bet.serverSeed, bet.clientSeed, bet.nonce);
		} else {
			return json({ success: false, error: 'Unknown game type' }, { status: 400 });
		}

		// Verify the result matches
		const verified =
			seedHashValid && verifyGameResult(bet.serverSeed, bet.clientSeed, bet.nonce, bet.result);

		return json({
			success: true,
			data: {
				betId: bet.id,
				verified,
				serverSeed: bet.serverSeed,
				serverSeedHash: bet.serverSeedHash,
				clientSeed: bet.clientSeed,
				nonce: bet.nonce,
				expectedResult: bet.result,
				calculatedResult,
				gameType: bet.gameType,
				seedHashValid,
				gameData:
					typeof bet.gameData === 'string'
						? JSON.parse(bet.gameData)
						: (bet.gameData as Record<string, unknown>)
			}
		});
	} catch (error) {
		console.error('Bet verification error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
