import type { GameHistory } from '$lib/types/game';
import type { BetHistoryItem } from '$lib/api';

export function validateInput(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function calculateDiceWinChance(betType: 'over' | 'under', rollTarget: number): number {
	if (betType === 'over') {
		return Math.round((100 - rollTarget) * 100) / 100;
	} else {
		return Math.round(rollTarget * 100) / 100;
	}
}

export function calculateMultiplier(winChance: number): number {
	return winChance > 0 ? Math.round((99 / winChance) * 10000) / 10000 : 1;
}

export function calculateProfit(betAmount: number, multiplier: number): number {
	return betAmount * (multiplier - 1);
}

export function generateGameId(): string {
	return crypto.randomUUID();
}

export function addToHistory(
	histories: GameHistory[],
	newHistory: GameHistory,
	maxEntries = 20
): GameHistory[] {
	return [newHistory, ...histories].slice(0, maxEntries);
}

export function simulateDiceRoll(): number {
	return Math.random() * 100;
}

export function simulateCoinFlip(): 'cat' | 'dog' {
	return Math.random() < 0.5 ? 'cat' : 'dog';
}

export function checkDiceWin(
	diceRoll: number,
	betType: 'over' | 'under',
	rollTarget: number
): boolean {
	return betType === 'over' ? diceRoll > rollTarget : diceRoll < rollTarget;
}

export function checkCoinFlipWin(result: 'cat' | 'dog', betSide: 'cat' | 'dog'): boolean {
	return result === betSide;
}

export function convertBetHistoryToGameHistory(betHistory: BetHistoryItem[]): GameHistory[] {
	return betHistory.map((bet) => ({
		win: bet.win,
		value: bet.result,
		betId: bet.id
	}));
}
