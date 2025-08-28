// API utility functions for game backend

export interface DiceBetRequest {
	amount: number;
	betType: 'over' | 'under';
	target: number;
	clientSeed?: string;
}

export interface DiceBetResult {
	betId: string;
	roll: number;
	win: boolean;
	payout: number;
	newBalance: number;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
}

export interface CoinFlipBetRequest {
	amount: number;
	side: 'cat' | 'dog';
	clientSeed?: string;
}

export interface CoinFlipBetResult {
	betId: string;
	flipResult: 'cat' | 'dog';
	win: boolean;
	payout: number;
	newBalance: number;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
}

export interface ApiResponse<T> {
	success: boolean;
	result?: T;
	data?: T;
	error?: string;
}

export interface BetHistoryItem {
	id: string;
	gameType: 'dice' | 'flip';
	amount: number;
	multiplier: number;
	win: boolean;
	payout: number;
	result: number;
	gameData: Record<string, unknown>;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
	createdAt: Date;
}

export interface BetHistoryResponse {
	bets: BetHistoryItem[];
	total: number;
	page: number;
	limit: number;
}

export interface BetVerificationData {
	betId: string;
	verified: boolean;
	serverSeed: string;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
	expectedResult: number;
	calculatedResult: number;
	gameType: 'dice' | 'flip';
	seedHashValid: boolean;
	gameData: Record<string, unknown>;
}

/**
 * Place a dice bet
 */
export async function placeDiceBet(request: DiceBetRequest): Promise<ApiResponse<DiceBetResult>> {
	try {
		const response = await fetch('/api/game/dice', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}

/**
 * Place a coin flip bet
 */
export async function placeCoinFlipBet(
	request: CoinFlipBetRequest
): Promise<ApiResponse<CoinFlipBetResult>> {
	try {
		const response = await fetch('/api/game/flip', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}

/**
 * Get bet history
 */
export async function getBetHistory(
	page = 1,
	limit = 20,
	gameType?: 'dice' | 'flip'
): Promise<ApiResponse<BetHistoryResponse>> {
	try {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString()
		});

		if (gameType) {
			params.append('gameType', gameType);
		}

		const response = await fetch(`/api/game/history?${params}`);
		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}

/**
 * Verify a bet's provable fairness
 */
export async function verifyBet(betId: string): Promise<ApiResponse<BetVerificationData>> {
	try {
		const response = await fetch(`/api/game/verify?betId=${encodeURIComponent(betId)}`);
		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}

/**
 * Get current user balance and next nonce (for dice game)
 */
export async function getDiceGameData(): Promise<
	ApiResponse<{
		nextNonce: number;
		nextServerSeedHash: string;
		balance: number;
	}>
> {
	try {
		const response = await fetch('/api/game/dice');
		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}

/**
 * Get current user balance and next nonce (for flip game)
 */
export async function getFlipGameData(): Promise<
	ApiResponse<{
		nextNonce: number;
		nextServerSeedHash: string;
		balance: number;
	}>
> {
	try {
		const response = await fetch('/api/game/flip');
		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: 'Network error occurred'
		};
	}
}
