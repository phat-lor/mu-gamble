<script lang="ts">
	interface Props {
		cubeVisible: boolean;
		cubePos: number;
		cubeOpacity: number;
		cubeLabel: string;
		cubeIsWin: boolean;
		cubeSliding: boolean;
	}

	let { cubeVisible, cubePos, cubeOpacity, cubeLabel, cubeIsWin, cubeSliding }: Props = $props();
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
					{cubeLabel}
				</span>
			</div>

			<div
				class="absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 rounded-[4px] bg-white shadow-md"
			></div>
		</div>
	</div>
{/if}
