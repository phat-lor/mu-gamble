<script lang="ts">
	interface Props {
		rollTarget: number;
		sliderValue: number[];
		betType: 'over' | 'under';
		onSliderChange: () => void;
		onDragStart: () => void;
		onDragEnd: () => void;
		isDragging: boolean;
	}

	let {
		rollTarget,
		sliderValue = $bindable(),
		betType,
		onSliderChange,
		onDragStart,
		onDragEnd,
		isDragging
	}: Props = $props();
</script>

<div class="relative mb-8 h-16">
	<div class="mb-4 flex justify-between text-sm text-muted-foreground">
		<span>0</span>
		<span>25</span>
		<span>50</span>
		<span>75</span>
		<span>100</span>
	</div>

	<div class="absolute inset-y-0 right-0 left-0 flex items-center">
		<div class="relative h-4 w-full rounded-full">
			{#if betType === 'over'}
				<div
					class="absolute top-0 left-0 h-full bg-red-500 {isDragging
						? ''
						: 'transition-all duration-300'}"
					style="width: {rollTarget}%"
				></div>
				<div
					class="absolute top-0 h-full bg-green-500 {isDragging
						? ''
						: 'transition-all duration-300'}"
					style="left: {rollTarget}%; width: {100 - rollTarget}%"
				></div>
			{:else}
				<div
					class="absolute top-0 left-0 h-full bg-green-500 {isDragging
						? ''
						: 'transition-all duration-300'}"
					style="width: {rollTarget}%"
				></div>
				<div
					class="absolute top-0 h-full bg-red-500 {isDragging ? '' : 'transition-all duration-300'}"
					style="left: {rollTarget}%; width: {100 - rollTarget}%"
				></div>
			{/if}
		</div>
	</div>

	<div
		class="pointer-events-none absolute top-1/2 z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform cursor-grab rounded-xl border-2 border-background bg-primary shadow-xl transition-transform hover:scale-105 active:scale-95 active:cursor-grabbing"
		style="left: {sliderValue[0]}%"
	>
		<div class="flex h-full w-full items-center justify-center rounded-xl bg-primary">
			<div class="h-4 w-0.5 rounded-full bg-primary-foreground"></div>
			<div class="ml-1 h-4 w-0.5 rounded-full bg-primary-foreground"></div>
		</div>
	</div>

	<input
		type="range"
		bind:value={sliderValue[0]}
		max="100"
		min="0"
		step="0.01"
		class="absolute inset-0 z-30 h-full w-full cursor-grab opacity-0 active:cursor-grabbing"
		oninput={onSliderChange}
		onmousedown={onDragStart}
		onmouseup={onDragEnd}
		onmouseleave={onDragEnd}
		ontouchstart={onDragStart}
		ontouchend={onDragEnd}
	/>
</div>
