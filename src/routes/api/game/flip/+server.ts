import type { RequestHandler } from './$types';
import {
	handleGameBet,
	handleGameData,
	type GameLogic,
	type GameBetRequest
} from '$lib/server/game-handler';
import {
	generateCoinFlip,
	isCoinFlipWin,
	calculateMultiplier,
	validateCoinFlipBet
} from '$lib/server/provably-fair';

interface CoinFlipBetRequest extends GameBetRequest {
	side: 'cat' | 'dog';
}

interface CoinFlipBetResult {
	betId: string;
	flipResult: 'cat' | 'dog';
	win: boolean;
	payout: number;
	newBalance: number;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
}

const coinFlipGameLogic: GameLogic<CoinFlipBetRequest, CoinFlipBetResult> = {
	gameType: 'flip',
	validateBet: (request, userBalance) =>
		validateCoinFlipBet(request.amount, request.side, userBalance),
	calculateResult: (serverSeed, clientSeed, nonce, request) => {
		const flipResultValue = generateCoinFlip(serverSeed, clientSeed, nonce);
		const flipResult: 'cat' | 'dog' = flipResultValue === 0 ? 'cat' : 'dog';
		const win = isCoinFlipWin(flipResultValue, request.side);
		const winChance = 49.5; // 49.5% win chance for coin flip (1% house edge)
		const multiplier = calculateMultiplier(winChance);
		const payout = win ? request.amount * multiplier : 0;

		return {
			win,
			payout,
			multiplier,
			result: flipResultValue,
			flipResult,
			gameData: {
				side: request.side,
				winChance
			}
		};
	}
};

export const POST: RequestHandler = async (event) => {
	return handleGameBet(event, coinFlipGameLogic);
};

// GET endpoint for retrieving current seeds (for verification)
export const GET: RequestHandler = async (event) => {
	return handleGameData(event, 'flip');
};
