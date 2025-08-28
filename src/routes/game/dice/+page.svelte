<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import {
		GameModeToggle,
		BetAmountInput,
		ProfitDisplay,
		GameHistory,
		DiceSlider,
		FloatingDice,
		DiceControls
	} from '$lib/components/game';
	import * as m from '$lib/paraglide/messages';
	import {
		calculateDiceWinChance,
		calculateMultiplier,
		calculateProfit,
		validateInput,
		addToHistory,
		convertBetHistoryToGameHistory
	} from '$lib/utils/game';
	import { placeDiceBet, getBetHistory } from '$lib/api';
	import { toast } from 'svelte-sonner';
	import type { GameMode, GameHistory as GameHistoryType } from '$lib/types/game';

	let gameMode = $state<GameMode>('manual');
	let betType = $state<'over' | 'under'>('over');
	let betAmount = $state(0.0);
	let profitOnWin = $state(0.0);
	let multiplier = $state(1.98);
	let rollTarget = $state(50);
	let winChance = $state(49.5);
	let sliderValue = $state([50]);
	let isDragging = $state(false);

	// Floating dice cube state
	const cubePos = tweened<number>(50, { duration: 500, easing: cubicInOut }); // 0–100 %
	let cubeLabel = $state('50.00');
	let cubeIsWin = $state<boolean>(true);
	let cubeSliding = $state(false); // toggles idle float
	let cubeVisible = $state(false); // controls visibility
	let cubeOpacity = $state(0); // controls fade in/out
	let cubeIdleTimer: ReturnType<typeof setTimeout>;

	let histories = $state<GameHistoryType[]>([]);

	$effect(() => {
		winChance = calculateDiceWinChance(betType, rollTarget);
		multiplier = calculateMultiplier(winChance);
		profitOnWin = calculateProfit(betAmount, multiplier);
	});

	// Load game history on mount
	$effect(() => {
		loadGameHistory();
	});

	async function loadGameHistory() {
		try {
			const response = await getBetHistory(1, 20, 'dice');
			console.log('Dice history response:', response);
			if (response.success && response.data) {
				console.log('Converting bet history:', response.data.bets);
				histories = convertBetHistoryToGameHistory(response.data.bets);
				console.log('Converted histories:', histories);
			}
		} catch (error) {
			console.error('Failed to load game history:', error);
		}
	}

	function updateRollTargetFromSlider() {
		rollTarget = Math.round(sliderValue[0] * 100) / 100;
	}

	function updateRollTargetFromInput() {
		rollTarget = validateInput(rollTarget, 0, 100);
		sliderValue[0] = rollTarget;
	}

	function updateWinChanceFromInput() {
		winChance = validateInput(winChance, 0, 100);
		if (betType === 'over') {
			rollTarget = Math.round((100 - winChance) * 100) / 100;
		} else {
			rollTarget = Math.round(winChance * 100) / 100;
		}
		sliderValue[0] = rollTarget;
	}

	function updateMultiplierFromInput() {
		multiplier = Math.max(1, multiplier);
		winChance = Math.round((99 / multiplier) * 100) / 100;
		if (betType === 'over') {
			rollTarget = Math.round((100 - winChance) * 100) / 100;
		} else {
			rollTarget = Math.round(winChance * 100) / 100;
		}
		sliderValue[0] = rollTarget;
	}

	function handleMultiplierChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value) && value >= 1) {
			multiplier = value;
			updateMultiplierFromInput();
		}
	}

	function handleRollTargetChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value) && value >= 0 && value <= 100) {
			rollTarget = value;
			updateRollTargetFromInput();
		}
	}

	function handleWinChanceChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value) && value >= 0 && value <= 100) {
			winChance = value;
			updateWinChanceFromInput();
		}
	}

	function toggleBetType() {
		betType = betType === 'over' ? 'under' : 'over';
	}

	function handleBetAmountChange(amount: number) {
		betAmount = amount;
	}

	function handleBetMultiplier(multiplierValue: number) {
		betAmount = betAmount * multiplierValue;
	}

	import { userStore } from '$lib/stores/user-store';

	let isPlacingBet = $state(false);

	// Subscribe to user store for balance
	let userState = $derived($userStore);
	let userBalance = $derived(userState.user?.balance ?? 1000);

	async function handleBet() {
		if (isPlacingBet) return;

		// Validate bet amount
		if (betAmount <= 0) {
			toast.error('Bet amount must be greater than 0');
			return;
		}

		if (betAmount > userBalance) {
			toast.error('Insufficient balance');
			return;
		}

		isPlacingBet = true;

		try {
			const response = await placeDiceBet({
				amount: betAmount,
				betType,
				target: rollTarget
			});

			if (response.success && response.result) {
				const { roll, win, payout, newBalance, betId } = response.result;

				// Update the floating cube
				cubeIsWin = win;
				cubeLabel = roll.toFixed(2);
				cubeSliding = true;

				// Show cube with fade-in
				cubeVisible = true;
				setTimeout(() => (cubeOpacity = 1), 10);

				// Clear any existing idle timer and fade-out
				if (cubeIdleTimer) {
					clearTimeout(cubeIdleTimer);
				}
				cubeOpacity = 1;

				// clamp just in case
				const target = Math.min(100, Math.max(0, roll));

				// Use the cubePos subscription to properly time the animation end
				cubePos.set(target, { duration: 500, easing: cubicInOut }).then(() => {
					cubeSliding = false;

					// Start idle timer to fade out after 5 seconds
					cubeIdleTimer = setTimeout(() => {
						cubeOpacity = 0;
						setTimeout(() => (cubeVisible = false), 500);
					}, 5000);
				});

				// Update game history
				const newHistory: GameHistoryType = {
					win,
					value: roll,
					betId
				};

				histories = addToHistory(histories, newHistory);

				// Update user balance in the global store
				userStore.updateBalance(newBalance);

				console.log('Bet result:', {
					roll: roll.toFixed(2),
					win,
					payout,
					betAmount,
					betType,
					rollTarget,
					winChance,
					multiplier,
					newBalance
				});
			} else {
				toast.error(response.error || 'Failed to place bet');
			}
		} catch (error) {
			console.error('Error placing bet:', error);
			toast.error('Network error occurred');
		} finally {
			isPlacingBet = false;
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
					<Button
						class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						onclick={handleBet}
						disabled={isPlacingBet || betAmount <= 0 || betAmount > userBalance}
					>
						{isPlacingBet ? 'Placing Bet...' : 'Bet'}
					</Button>
				</CardContent>
			</Card>
		</div>

		<div class="lg:col-span-2">
			<Card class="h-full border-border bg-card py-0">
				<CardContent class="flex h-full flex-col justify-between p-6">
					<GameHistory {histories} />

					<div class="space-y-6">
						<div class="relative">
							<FloatingDice
								{cubeVisible}
								cubePos={$cubePos}
								{cubeOpacity}
								{cubeLabel}
								{cubeIsWin}
								{cubeSliding}
							/>

							<DiceSlider
								{rollTarget}
								bind:sliderValue
								{betType}
								onSliderChange={updateRollTargetFromSlider}
								onDragStart={() => (isDragging = true)}
								onDragEnd={() => {
									isDragging = false;
									updateRollTargetFromSlider();
								}}
								{isDragging}
							/>
						</div>

						<div class="mt-8">
							<DiceControls
								{multiplier}
								{rollTarget}
								{winChance}
								{betType}
								onMultiplierChange={handleMultiplierChange}
								onRollTargetChange={handleRollTargetChange}
								onWinChanceChange={handleWinChanceChange}
								onToggleBetType={toggleBetType}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
