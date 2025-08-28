<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		GameModeToggle,
		BetAmountInput,
		ProfitDisplay,
		GameHistory,
		CoinSelector,
		CoinDisplay,
		MultiplierOverlay
	} from '$lib/components/game';
	import { calculateProfit, addToHistory, convertBetHistoryToGameHistory } from '$lib/utils/game';
	import { placeCoinFlipBet, getBetHistory } from '$lib/api';
	import { toast } from 'svelte-sonner';
	import type { GameMode, GameHistory as GameHistoryType } from '$lib/types/game';

	let gameMode = $state<GameMode>('manual');
	let betAmount = $state(0.0);
	let profitOnWin = $state(0.0);
	let coinRotation = $state(0);
	let selectedSide = $state<'cat' | 'dog'>('cat');
	let isFlipping = $state(false);
	let showWin = $state(false);
	let overlayMultiplier = $state(2.0);
	let overlayPayout = $state(0);
	let _overlayTimer: ReturnType<typeof setTimeout> | null = null;
	let userBalance = $state(1000); // Default balance for new users
	let histories = $state<GameHistoryType[]>([]);

	const multiplier = 2.0;

	$effect(() => {
		profitOnWin = calculateProfit(betAmount, multiplier);
	});

	// Load game history on mount
	$effect(() => {
		loadGameHistory();
	});

	async function loadGameHistory() {
		try {
			const response = await getBetHistory(1, 20, 'flip');
			console.log('Flip history response:', response);
			if (response.success && response.data) {
				console.log('Converting bet history:', response.data.bets);
				// Convert flip game history with cat/dog labels
				histories = response.data.bets.map((bet) => ({
					win: bet.win,
					value: bet.result === 1 ? 'Cat' : 'Dog',
					betId: bet.id
				}));
				console.log('Converted histories:', histories);
			}
		} catch (error) {
			console.error('Failed to load game history:', error);
		}
	}

	function handleBetAmountChange(amount: number) {
		betAmount = amount;
	}

	function handleBetMultiplier(multiplierValue: number) {
		betAmount = betAmount * multiplierValue;
	}

	function handleSideSelect(side: 'cat' | 'dog') {
		if (!isFlipping) {
			selectedSide = side;
		}
	}

	async function handleBet() {
		if (isFlipping) return;

		// Validate bet amount
		if (betAmount <= 0) {
			toast.error('Bet amount must be greater than 0');
			return;
		}

		if (betAmount > userBalance) {
			toast.error('Insufficient balance');
			return;
		}

		isFlipping = true;

		try {
			const response = await placeCoinFlipBet({
				amount: betAmount,
				side: selectedSide
			});

			if (response.success && response.result) {
				const { flipResult, win, payout, newBalance, betId } = response.result;

				const spins = 3 + Math.floor(Math.random() * 7); // Ensure at least 3 spins
				const finalRotation = flipResult === 'cat' ? 0 : 180;
				coinRotation = spins * 360 + finalRotation;

				setTimeout(() => {
					const newHistory: GameHistoryType = {
						win,
						value: flipResult,
						betId
					};

					// Update game history
					histories = addToHistory(histories, newHistory);

					// show overlay on win
					if (win) {
						overlayMultiplier = multiplier;
						overlayPayout = payout;
						showWin = true;
						if (_overlayTimer) clearTimeout(_overlayTimer);
						_overlayTimer = setTimeout(() => (showWin = false), 1800);
					} else {
						showWin = false;
					}

					// Update user balance and show toast
					userBalance = newBalance;
					isFlipping = false;

					console.log('Bet result:', {
						flipResult,
						win,
						payout,
						betAmount,
						selectedSide,
						multiplier,
						newBalance
					});
				}, 2000);
			} else {
				toast.error(response.error || 'Failed to place bet');
				isFlipping = false;
			}
		} catch (error) {
			console.error('Error placing bet:', error);
			toast.error('Network error occurred');
			isFlipping = false;
		}
	}
</script>

<div class="mx-auto max-w-7xl">
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-1">
			<Card class="border-border bg-card py-2">
				<CardContent class="space-y-4 p-4">
					<GameModeToggle {gameMode} onModeChange={(mode) => (gameMode = mode)} />
					<BetAmountInput
						{betAmount}
						onAmountChange={handleBetAmountChange}
						onMultiplier={handleBetMultiplier}
					/>
					<ProfitDisplay {profitOnWin} {multiplier} />
					<CoinSelector {selectedSide} {isFlipping} onSideSelect={handleSideSelect} />
					<Button
						class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						onclick={handleBet}
						disabled={isFlipping || betAmount <= 0 || betAmount > userBalance}
					>
						{isFlipping ? 'Flipping...' : 'Flip Coin'}
					</Button>
				</CardContent>
			</Card>
		</div>

		<div class="lg:col-span-2">
			<Card class="h-full border-border bg-card py-0">
				<CardContent class="flex h-full flex-col justify-between p-6">
					<GameHistory {histories} />

					<div class="relative flex min-h-[300px] flex-col justify-center">
						<CoinDisplay {coinRotation} />
						<MultiplierOverlay
							multiplier={overlayMultiplier}
							payout={overlayPayout}
							show={showWin}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
