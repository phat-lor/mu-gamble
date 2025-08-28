<script lang="ts">
	export let multiplier: number = 2.0; // e.g. 1.96
	export let payout: number = 0; // profit on win
</script>

<!-- center everything; ignore pointer events -->
<div class="pointer-events-none absolute inset-0 z-40 grid place-items-center" aria-live="polite">
	<!-- orange donut ring -->
	<div class="win-ring animate-pop"></div>

	<!-- neon card -->
	<div
		class="animate-card relative -mt-2 rounded-2xl bg-[#1f2937] px-6 py-4 shadow-2xl ring-4 ring-emerald-500/90"
	>
		<div class="text-3xl font-extrabold tracking-tight text-emerald-400">
			{multiplier.toFixed(2)}×
		</div>
		<div class="my-2 h-px w-16 bg-white/15"></div>
		<div class="font-bold text-emerald-400">
			${payout.toFixed(2)} <span class="align-[1px]">₿</span>
		</div>

		<!-- outer glow -->
		<div
			class="pointer-events-none absolute -inset-1 rounded-2xl ring-4 ring-emerald-500/80 blur-[1.5px]"
		></div>
	</div>
</div>

<style>
	/* donut via radial gradient */
	.win-ring {
		width: 360px;
		height: 360px;
		border-radius: 9999px;
		background: radial-gradient(
			circle at center,
			transparent 0 40%,
			#f59e0b 40% 65%,
			transparent 65% 100%
		);
		filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.45));
	}

	@keyframes pop {
		from {
			transform: scale(0.92);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	@keyframes cardIn {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-pop {
		animation: pop 0.28s ease-out both;
	}
	.animate-card {
		animation: cardIn 0.28s ease-out 0.05s both;
	}
</style>
