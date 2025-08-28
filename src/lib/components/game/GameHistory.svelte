<script lang="ts">
	import type { GameHistory } from '$lib/types/game';

	interface Props {
		histories: GameHistory[];
	}

	let { histories }: Props = $props();
</script>

<div class="mb-6">
	<div class="scrollbar-hide flex flex-row-reverse gap-2 overflow-x-auto overflow-y-hidden pb-2">
		{#each histories as history (history.betId)}
			<div
				class="flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap {history.win
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground'}"
			>
				{history.value}
			</div>
		{/each}
	</div>
</div>
