export type GameMode = 'manual' | 'auto';

export interface BetState {
	amount: number;
	profitOnWin: number;
}

export interface GameHistory {
	win: boolean;
	value: number | string;
	betId: string;
}

export interface DiceGameState extends BetState {
	betType: 'over' | 'under';
	multiplier: number;
	rollTarget: number;
	winChance: number;
}

export interface CoinFlipState extends BetState {
	side: 'cat' | 'dog';
	multiplier: number;
}
