<script lang="ts">
	import { RotateCcw } from 'lucide-svelte';
	import type { GameMode } from '$lib/types/game';

	interface Props {
		gameMode: GameMode;
		onModeChange: (mode: GameMode) => void;
	}

	let { gameMode, onModeChange }: Props = $props();
</script>

<div class="flex rounded-lg border border-border bg-muted p-1">
	<button
		class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all {gameMode === 'manual'
			? 'bg-primary text-primary-foreground shadow-sm'
			: 'text-muted-foreground hover:text-foreground'}"
		onclick={() => onModeChange('manual')}
	>
		Manual
	</button>
	<button
		class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all {gameMode === 'auto'
			? 'bg-primary text-primary-foreground shadow-sm'
			: 'text-muted-foreground hover:text-foreground'}"
		onclick={() => onModeChange('auto')}
		disabled
	>
		Auto
	</button>
	<div class="flex items-center justify-center px-2">
		<RotateCcw class="h-4 w-4 text-muted-foreground" />
	</div>
</div>
