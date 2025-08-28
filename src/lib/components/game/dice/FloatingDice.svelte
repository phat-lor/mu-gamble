<script lang="ts">
	import { onDestroy } from 'svelte';

	interface Props {
		cubeVisible: boolean;
		cubePos: number;
		cubeOpacity: number;
		cubeLabel: string;
		cubeIsWin: boolean;
		cubeSliding: boolean;
	}

	let { cubeVisible, cubePos, cubeOpacity, cubeLabel, cubeIsWin, cubeSliding }: Props = $props();

	// Animation state for number counting
	let displayValue = $state('');
	let isAnimating = $state(false);
	let animationInterval: ReturnType<typeof setInterval>;
	let lastTargetValue = $state(''); // Track the last target to detect new bets

	// Watch for label changes and trigger counting animation
	$effect(() => {
		if (cubeLabel && cubeLabel !== lastTargetValue) {
			// Clear any existing animation immediately
			if (animationInterval) {
				clearInterval(animationInterval);
				isAnimating = false;
			}

			const targetValue = parseFloat(cubeLabel);
			const currentValue = parseFloat(displayValue) || 0;

			// Update the last target value
			lastTargetValue = cubeLabel;

			if (!isNaN(targetValue) && !isNaN(currentValue)) {
				startCountingAnimation(currentValue, targetValue);
			} else {
				displayValue = cubeLabel;
			}
		}
	});

	function startCountingAnimation(from: number, to: number) {
		// Clear any existing animation
		if (animationInterval) {
			clearInterval(animationInterval);
		}

		isAnimating = true;
		let current = from;
		const totalSteps = 15; // Fewer steps for faster animation
		const step = (to - from) / totalSteps;
		const duration = 400; // Much faster - 0.4 seconds total animation
		const intervalTime = duration / totalSteps;

		animationInterval = setInterval(() => {
			current += step;

			// Ensure we don't overshoot
			if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
				current = to;
				clearInterval(animationInterval);
				isAnimating = false;
			}

			displayValue = current.toFixed(2);
		}, intervalTime);
	}

	// Initialize with current label
	$effect(() => {
		if (cubeLabel && !displayValue && !lastTargetValue) {
			displayValue = cubeLabel;
			lastTargetValue = cubeLabel;
		}
	});

	// Cleanup on component destroy
	onDestroy(() => {
		if (animationInterval) {
			clearInterval(animationInterval);
		}
	});
</script>

{#if cubeVisible}
	<div
		class="pointer-events-none absolute -top-6 z-30 w-24 transition-opacity duration-500 select-none"
		style="left: calc({cubePos}% - 3.5rem); opacity: {cubeOpacity}"
		aria-live="polite"
	>
		<div class={`relative transition-all duration-100 ease-out ${cubeSliding && 'scale-95'}`}>
			<div class="rounded-2xl bg-foreground p-1 text-center shadow-2xl ring-1 ring-black/5">
				<span
					class={`text-xl font-extrabold tracking-tight tabular-nums ${cubeIsWin ? 'text-emerald-500' : 'text-rose-500'}`}
				>
					{displayValue}
				</span>
			</div>

			<div
				class="absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 rounded-[4px] bg-white shadow-md"
			></div>
		</div>
	</div>
{/if}
