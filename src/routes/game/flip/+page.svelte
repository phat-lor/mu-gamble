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
	import { calculateProfit, addToHistory } from '$lib/utils/game';
	import { placeCoinFlipBet, getBetHistory } from '$lib/api';
	import { handleApiResponse, validation } from '$lib/utils/error-handling';
	import type { GameMode, GameHistory as GameHistoryType } from '$lib/types/game';

	let gameMode = $state<GameMode>('manual');
	let betAmount = $state(0.0);
	let profitOnWin = $state(0.0);
	let coinRotation = $state(0);
	let selectedSide = $state<'cat' | 'dog'>('cat');
	let isFlipping = $state(false);
	let showWin = $state(false);
	let overlayMultiplier = $state(2.0);
	import { userStore } from '$lib/stores/user-store';

	let overlayPayout = $state(0);
	let _overlayTimer: ReturnType<typeof setTimeout> | null = null;

	// Subscribe to user store for balance
	let userState = $derived($userStore);
	let userBalance = $derived(userState.user?.balance ?? 1000);

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
		const response = await getBetHistory(1, 20, 'flip');

		const data = handleApiResponse(response, {
			showErrorToast: false, // Don't show toast for initial load
			onError: (error) => {
				console.error('Failed to load game history:', error);
			}
		});

		if (data) {
			// Convert flip game history with cat/dog labels
			histories = data.bets.map((bet) => ({
				win: bet.win,
				value: bet.result === 0 ? 'Cat' : 'Dog',
				betId: bet.id
			}));
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

		// Client-side validation
		const betValidation = validation.betAmount(betAmount, userBalance);
		if (!betValidation.valid) {
			handleApiResponse(
				{ success: false, error: betValidation.error! },
				{
					showErrorToast: true
				}
			);
			return;
		}

		isFlipping = true;

		const response = await placeCoinFlipBet({
			amount: betAmount,
			side: selectedSide
		});

		const result = handleApiResponse(response, {
			showErrorToast: true,
			onError: () => {
				isFlipping = false;
			}
		});

		if (result) {
			const { flipResult, win, payout, newBalance, betId } = result;

			// Animate coin flip
			const spins = 3 + Math.floor(Math.random() * 7);
			const finalRotation = flipResult === 'cat' ? 0 : 180;
			coinRotation = spins * 360 + finalRotation;

			// Update state after animation
			setTimeout(() => {
				// Update game history
				histories = addToHistory(histories, {
					win,
					value: flipResult === 'cat' ? 'Cat' : 'Dog',
					betId
				});

				// Show win overlay
				if (win) {
					overlayMultiplier = multiplier;
					overlayPayout = payout;
					showWin = true;
					if (_overlayTimer) clearTimeout(_overlayTimer);
					_overlayTimer = setTimeout(() => (showWin = false), 1800);
				} else {
					showWin = false;
				}

				// Update balance in the global store
				userStore.updateBalance(newBalance);
				isFlipping = false;
			}, 2000);
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
