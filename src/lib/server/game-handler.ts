/**
 * Shared game logic to reduce code duplication between game endpoints
 */

import { json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import { isRateLimited, RATE_LIMITS, getRateLimitHeaders } from '$lib/server/rate-limiter';
import { handleCSRF } from '$lib/server/csrf';
import {
	generateServerSeed,
	generateClientSeed,
	type ProvablyFairData
} from '$lib/server/provably-fair';

export interface GameBetRequest {
	amount: number;
	clientSeed?: string;
	[key: string]: any; // Allow additional game-specific parameters
}

export interface GameBetResult {
	betId: string;
	win: boolean;
	payout: number;
	newBalance: number;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
	[key: string]: unknown; // Allow additional game-specific return values
}

export interface GameLogic<TRequest extends GameBetRequest, TResult extends GameBetResult> {
	validateBet: (request: TRequest, userBalance: number) => { valid: boolean; error?: string };
	calculateResult: (
		serverSeed: string,
		clientSeed: string,
		nonce: number,
		request: TRequest
	) => {
		win: boolean;
		payout: number;
		multiplier: number;
		gameData: Record<string, unknown>;
		result: number;
		[key: string]: unknown;
	};
	gameType: 'dice' | 'flip';
}

/**
 * Generic game bet handler that implements common security measures and database operations
 */
export async function handleGameBet<TRequest extends GameBetRequest, TResult extends GameBetResult>(
	event: RequestEvent,
	gameLogic: GameLogic<TRequest, TResult>
): Promise<Response> {
	try {
		// CSRF Protection
		if (!handleCSRF(event)) {
			return json({ success: false, error: 'CSRF token validation failed' }, { status: 403 });
		}

		// Authentication check
		const sessionToken = auth.getSessionToken(event);
		if (!sessionToken) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { session, user } = await auth.validateSessionToken(sessionToken);
		if (!session || !user) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		// Rate Limiting for betting
		const userIdentifier = `${user.id}:betting`;
		const rateLimitResult = isRateLimited(userIdentifier, RATE_LIMITS.betting);
		const headers = getRateLimitHeaders(userIdentifier, RATE_LIMITS.betting);

		if (rateLimitResult.limited) {
			return json(
				{ success: false, error: 'Too many bets. Please slow down.' },
				{ status: 429, headers }
			);
		}

		// Parse request body
		let betRequest: TRequest;
		try {
			betRequest = await event.request.json();
		} catch {
			return json({ success: false, error: 'Invalid request body' }, { status: 400, headers });
		}

		// Validate bet parameters
		const validation = gameLogic.validateBet(betRequest, user.balance);
		if (!validation.valid) {
			return json({ success: false, error: validation.error }, { status: 400, headers });
		}

		// Generate provably fair data
		const { seed: serverSeed, hash: serverSeedHash } = generateServerSeed();
		const finalClientSeed = betRequest.clientSeed || generateClientSeed();

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

			if (currentUser.length === 0 || currentUser[0].balance < betRequest.amount) {
				throw new Error('Insufficient balance');
			}

			// Calculate game result
			const gameResult = gameLogic.calculateResult(serverSeed, finalClientSeed, nonce, betRequest);
			const balanceChange = gameResult.payout - betRequest.amount;

			// Generate bet ID
			const betId = crypto.randomUUID();

			// Insert bet record
			tx.insert(table.bet)
				.values({
					id: betId,
					userId: user.id,
					gameType: gameLogic.gameType,
					amount: betRequest.amount,
					multiplier: gameResult.multiplier,
					win: gameResult.win,
					payout: gameResult.payout,
					serverSeed,
					serverSeedHash,
					clientSeed: finalClientSeed,
					nonce,
					gameData: JSON.stringify(gameResult.gameData),
					result: gameResult.result
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

			// Create the base result with common fields
			const baseResult = {
				betId,
				win: gameResult.win,
				payout: Math.round(gameResult.payout * 100) / 100,
				newBalance: Math.round(updatedUser[0].balance * 100) / 100,
				serverSeedHash,
				clientSeed: finalClientSeed,
				nonce
			};

			// Create game-specific result excluding common fields
			const { win, payout, multiplier, gameData, result, ...gameSpecificResult } = gameResult;

			return { ...baseResult, ...gameSpecificResult } as TResult;
		});

		return json(
			{
				success: true,
				result
			},
			{ headers }
		);
	} catch (error) {
		console.error(`${gameLogic.gameType} bet error:`, error);

		// Return appropriate error message
		if (error instanceof Error) {
			if (error.message === 'Insufficient balance') {
				return json({ success: false, error: 'Insufficient balance' }, { status: 400 });
			}
		}

		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

/**
 * Generic GET handler for game data endpoints
 */
export async function handleGameData(
	event: RequestEvent,
	gameType: 'dice' | 'flip'
): Promise<Response> {
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
		console.error(`Get ${gameType} data error:`, error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
