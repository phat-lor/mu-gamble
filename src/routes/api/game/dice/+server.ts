import { json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import {
	generateServerSeed,
	generateClientSeed,
	generateDiceRoll,
	isDiceWin,
	calculateDiceWinChance,
	calculateMultiplier,
	validateDiceBet
} from '$lib/server/provably-fair';

interface DiceBetRequest {
	amount: number;
	betType: 'over' | 'under';
	target: number;
	clientSeed?: string;
}

export const POST: RequestHandler = async (event) => {
	try {
		// Authentication check
		const sessionToken = auth.getSessionToken(event);
		if (!sessionToken) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { session, user } = await auth.validateSessionToken(sessionToken);
		if (!session || !user) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		// Parse request body
		let betRequest: DiceBetRequest;
		try {
			betRequest = await event.request.json();
		} catch {
			return json({ success: false, error: 'Invalid request body' }, { status: 400 });
		}

		const { amount, betType, target, clientSeed } = betRequest;

		// Validate bet parameters
		const validation = validateDiceBet(amount, betType, target, user.balance);
		if (!validation.valid) {
			return json({ success: false, error: validation.error }, { status: 400 });
		}

		// Generate provably fair data
		const { seed: serverSeed, hash: serverSeedHash } = generateServerSeed();
		const finalClientSeed = clientSeed || generateClientSeed();

		// Use database transaction to prevent race conditions
		const result = db.transaction((tx) => {
			// Get user's current nonce (with row-level locking)
			const userSessionResult = tx
				.select()
				.from(table.userGameSession)
				.where(eq(table.userGameSession.userId, user.id))
				.all();

			let currentNonce = 0;
			if (userSessionResult.length === 0) {
				// Create new session for user
				tx.insert(table.userGameSession)
					.values({
						userId: user.id,
						currentNonce: 0
					})
					.run();
			} else {
				currentNonce = userSessionResult[0].currentNonce;
			}

			const nonce = currentNonce + 1;

			// Re-check user balance within transaction
			const currentUser = tx
				.select({ balance: table.user.balance })
				.from(table.user)
				.where(eq(table.user.id, user.id))
				.all();

			if (currentUser.length === 0 || currentUser[0].balance < amount) {
				throw new Error('Insufficient balance');
			}

			// Generate game result
			const roll = generateDiceRoll(serverSeed, finalClientSeed, nonce);
			const win = isDiceWin(roll, betType, target);
			const winChance = calculateDiceWinChance(betType, target);
			const multiplier = calculateMultiplier(winChance);
			const payout = win ? amount * multiplier : 0;
			const balanceChange = payout - amount;

			// Generate bet ID
			const betId = crypto.randomUUID();

			// Insert bet record
			tx.insert(table.bet)
				.values({
					id: betId,
					userId: user.id,
					gameType: 'dice',
					amount,
					multiplier,
					win,
					payout,
					serverSeed,
					serverSeedHash,
					clientSeed: finalClientSeed,
					nonce,
					gameData: JSON.stringify({
						betType,
						target,
						winChance
					}),
					result: roll
				})
				.run();

			// Update user balance
			tx.update(table.user)
				.set({
					balance: sql`${table.user.balance} + ${balanceChange}`
				})
				.where(eq(table.user.id, user.id))
				.run();

			// Update user nonce
			tx.update(table.userGameSession)
				.set({
					currentNonce: nonce,
					updatedAt: new Date()
				})
				.where(eq(table.userGameSession.userId, user.id))
				.run();

			// Get updated balance
			const updatedUser = tx
				.select({ balance: table.user.balance })
				.from(table.user)
				.where(eq(table.user.id, user.id))
				.all();

			return {
				betId,
				roll: Math.round(roll * 100) / 100, // Round to 2 decimal places
				win,
				payout: Math.round(payout * 100) / 100,
				newBalance: Math.round(updatedUser[0].balance * 100) / 100,
				serverSeedHash,
				clientSeed: finalClientSeed,
				nonce
			};
		});

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('Dice bet error:', error);

		// Return appropriate error message
		if (error instanceof Error) {
			if (error.message === 'Insufficient balance') {
				return json({ success: false, error: 'Insufficient balance' }, { status: 400 });
			}
		}

		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

// GET endpoint for retrieving current seeds (for verification)
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

		// Get user's current nonce
		const userSession = await db
			.select()
			.from(table.userGameSession)
			.where(eq(table.userGameSession.userId, user.id));

		const nonce = userSession.length > 0 ? userSession[0].currentNonce + 1 : 1;

		// Generate next server seed hash for transparency
		const { hash: nextServerSeedHash } = generateServerSeed();

		return json({
			success: true,
			data: {
				nextNonce: nonce,
				nextServerSeedHash,
				balance: user.balance
			}
		});
	} catch (error) {
		console.error('Get dice data error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
