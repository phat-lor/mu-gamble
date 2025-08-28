<script lang="ts">
	export let multiplier: number = 2.0;
	export let payout: number = 0;
	export let show: boolean = false;
</script>

<!-- center everything; ignore pointer events -->
<div
	class="pointer-events-none absolute inset-0 z-40 grid place-items-center transition-opacity duration-300 ease-in-out {show
		? 'opacity-100'
		: 'opacity-0'}"
	aria-live="polite"
>
	<!-- neon card -->
	<div
		class="animate-card relative rounded-2xl bg-[#1f2937] px-6 py-4 shadow-2xl ring-4 ring-emerald-500/90"
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

	.animate-card {
		animation: cardIn 0.28s ease-out both;
	}
</style>
