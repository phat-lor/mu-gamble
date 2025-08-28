import { createHash, createHmac, randomBytes } from 'crypto';

export interface ProvablyFairData {
	serverSeed: string;
	serverSeedHash: string;
	clientSeed: string;
	nonce: number;
}

export interface GameResult {
	result: number;
	verifiable: boolean;
}

/**
 * Generates a cryptographically secure server seed and its hash
 */
export function generateServerSeed(): { seed: string; hash: string } {
	const seed = randomBytes(32).toString('hex');
	const hash = createHash('sha256').update(seed).digest('hex');
	return { seed, hash };
}

/**
 * Generates a client seed if not provided
 */
export function generateClientSeed(): string {
	return randomBytes(16).toString('hex');
}

/**
 * Verifies that a server seed matches its hash
 */
export function verifyServerSeed(serverSeed: string, serverSeedHash: string): boolean {
	const hash = createHash('sha256').update(serverSeed).digest('hex');
	return hash === serverSeedHash;
}

/**
 * Generates a provably fair game result using HMAC-SHA256
 * This is the core function that determines game outcomes
 */
export function generateGameResult(serverSeed: string, clientSeed: string, nonce: number): number {
	// Create HMAC using server seed as key
	const hmac = createHmac('sha256', serverSeed);

	// Update with client seed and nonce
	hmac.update(`${clientSeed}-${nonce}`);

	// Get the hash
	const hash = hmac.digest('hex');

	// Convert first 8 characters to decimal
	const decimalValue = parseInt(hash.substring(0, 8), 16);

	// Return normalized value between 0 and 99.99
	return (decimalValue % 10000) / 100;
}

/**
 * Verifies a game result using the provably fair algorithm
 */
export function verifyGameResult(
	serverSeed: string,
	clientSeed: string,
	nonce: number,
	expectedResult: number
): boolean {
	const calculatedResult = generateGameResult(serverSeed, clientSeed, nonce);
	// Allow small floating point differences
	return Math.abs(calculatedResult - expectedResult) < 0.01;
}

/**
 * Generates dice game result (0-99.99)
 */
export function generateDiceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
	return generateGameResult(serverSeed, clientSeed, nonce);
}

/**
 * Generates coin flip result (0 = cat, 1 = dog)
 */
export function generateCoinFlip(serverSeed: string, clientSeed: string, nonce: number): 0 | 1 {
	const result = generateGameResult(serverSeed, clientSeed, nonce);
	return result < 50 ? 0 : 1;
}

/**
 * Determines if a dice bet is a win
 */
export function isDiceWin(roll: number, betType: 'over' | 'under', target: number): boolean {
	return betType === 'over' ? roll > target : roll < target;
}

/**
 * Determines if a coin flip bet is a win
 */
export function isCoinFlipWin(result: 0 | 1, betSide: 'cat' | 'dog'): boolean {
	const betValue = betSide === 'cat' ? 0 : 1;
	return result === betValue;
}

/**
 * Calculates win chance for dice game
 */
export function calculateDiceWinChance(betType: 'over' | 'under', target: number): number {
	if (betType === 'over') {
		return Math.max(0, Math.min(100, 100 - target));
	} else {
		return Math.max(0, Math.min(100, target));
	}
}

/**
 * Calculates multiplier based on win chance (with house edge)
 */
export function calculateMultiplier(winChance: number, houseEdge: number = 1): number {
	if (winChance <= 0) return 1;
	return (100 - houseEdge) / winChance;
}

/**
 * Validates bet parameters for dice game
 */
export function validateDiceBet(
	amount: number,
	betType: 'over' | 'under',
	target: number,
	balance: number
): { valid: boolean; error?: string } {
	if (amount <= 0) {
		return { valid: false, error: 'Bet amount must be positive' };
	}

	if (amount > balance) {
		return { valid: false, error: 'Insufficient balance' };
	}

	if (target < 0.01 || target > 99.99) {
		return { valid: false, error: 'Target must be between 0.01 and 99.99' };
	}

	const winChance = calculateDiceWinChance(betType, target);
	if (winChance < 1 || winChance > 98) {
		return { valid: false, error: 'Win chance must be between 1% and 98%' };
	}

	return { valid: true };
}

/**
 * Validates bet parameters for coin flip game
 */
export function validateCoinFlipBet(
	amount: number,
	side: 'cat' | 'dog',
	balance: number
): { valid: boolean; error?: string } {
	if (amount <= 0) {
		return { valid: false, error: 'Bet amount must be positive' };
	}

	if (amount > balance) {
		return { valid: false, error: 'Insufficient balance' };
	}

	if (side !== 'cat' && side !== 'dog') {
		return { valid: false, error: 'Invalid side selection' };
	}

	return { valid: true };
}
