import { json } from '@sveltejs/kit';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';

// GET endpoint for retrieving bet history
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

		// Parse query parameters
		const url = new URL(event.request.url);
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
		const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
		const gameType = url.searchParams.get('gameType') as 'dice' | 'flip' | null;
		const offset = (page - 1) * limit;

		// Build query conditions
		const conditions = [eq(table.bet.userId, user.id)];
		if (gameType && (gameType === 'dice' || gameType === 'flip')) {
			conditions.push(eq(table.bet.gameType, gameType));
		}

		// Get bets with pagination
		const bets = await db
			.select({
				id: table.bet.id,
				gameType: table.bet.gameType,
				amount: table.bet.amount,
				multiplier: table.bet.multiplier,
				win: table.bet.win,
				payout: table.bet.payout,
				result: table.bet.result,
				gameData: table.bet.gameData,
				serverSeedHash: table.bet.serverSeedHash,
				clientSeed: table.bet.clientSeed,
				nonce: table.bet.nonce,
				createdAt: table.bet.createdAt
			})
			.from(table.bet)
			.where(and(...conditions))
			.orderBy(desc(table.bet.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const totalResult = await db
			.select({ count: sql`count(*)`.as('count') })
			.from(table.bet)
			.where(and(...conditions));

		const total = Number(totalResult[0]?.count || 0);

		// Format response
		const formattedBets = bets.map((bet) => ({
			...bet,
			gameData:
				typeof bet.gameData === 'string'
					? JSON.parse(bet.gameData)
					: (bet.gameData as Record<string, unknown>)
		}));

		return json({
			success: true,
			data: {
				bets: formattedBets,
				total,
				page,
				limit
			}
		});
	} catch (error) {
		console.error('Bet history error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
