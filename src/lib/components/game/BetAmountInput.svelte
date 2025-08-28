<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		betAmount: number;
		onAmountChange: (amount: number) => void;
		onMultiplier: (multiplier: number) => void;
	}

	let { betAmount, onAmountChange, onMultiplier }: Props = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<label for="bet-amount" class="text-sm font-medium text-foreground">Bet Amount</label>
	</div>
	<div class="flex rounded-lg border border-border bg-muted">
		<Input
			id="bet-amount"
			type="number"
			value={betAmount}
			step="0.01"
			min="0"
			class="flex-1 border-0 bg-transparent text-foreground placeholder-slate-400 focus:ring-0"
			placeholder="0.00"
			oninput={(e) => {
				const value = parseFloat((e.target as HTMLInputElement).value) || 0;
				onAmountChange(value);
			}}
		/>
		<div class="flex items-center border-l border-border px-3">
			<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
				<span class="text-xs font-bold text-foreground">$</span>
			</div>
		</div>
	</div>
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="sm"
			class="flex-1 border-border text-foreground hover:bg-muted"
			onclick={() => onMultiplier(0.5)}
		>
			½
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="flex-1 border-border text-foreground hover:bg-muted"
			onclick={() => onMultiplier(2)}
		>
			2×
		</Button>
	</div>
</div>
