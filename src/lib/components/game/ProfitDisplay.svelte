<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		profitOnWin: number;
		multiplier?: number;
	}

	let { profitOnWin, multiplier }: Props = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<label for="profit-on-win" class="flex flex-row gap-1 text-sm font-medium text-foreground">
			{m['game.profit']()}
			{#if multiplier}
				<p class="text-muted-foreground">({multiplier.toFixed(2)}x)</p>
			{/if}
		</label>
	</div>
	<div class="flex rounded-lg border border-border bg-muted">
		<Input
			id="profit-on-win"
			type="number"
			value={profitOnWin.toFixed(2)}
			readonly
			class="flex-1 border-0 bg-transparent text-foreground focus:ring-0"
		/>
		<div class="flex items-center border-l border-border px-3">
			<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
				<span class="text-xs font-bold text-foreground">$</span>
			</div>
		</div>
	</div>
</div>
