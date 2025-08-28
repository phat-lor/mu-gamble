<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { RotateCcw, Percent, X } from 'lucide-svelte';

	interface Props {
		multiplier: number;
		rollTarget: number;
		winChance: number;
		betType: 'over' | 'under';
		onMultiplierChange: (event: Event) => void;
		onRollTargetChange: (event: Event) => void;
		onWinChanceChange: (event: Event) => void;
		onToggleBetType: () => void;
	}

	let {
		multiplier,
		rollTarget,
		winChance,
		betType,
		onMultiplierChange,
		onRollTargetChange,
		onWinChanceChange,
		onToggleBetType
	}: Props = $props();
</script>

<Card class="border-border bg-muted p-1">
	<CardContent class="p-4">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<h3 class="mb-2 text-start text-sm font-medium text-foreground">Multiplier</h3>
				<div class="relative">
					<Input
						type="number"
						value={multiplier}
						step="0.0001"
						min="1"
						class="border-border bg-background pr-8 text-left text-lg font-bold"
						oninput={onMultiplierChange}
						onblur={onMultiplierChange}
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground"
					>
						<X class="h-4 w-4" />
					</div>
				</div>
			</div>

			<div>
				<h3 class="mb-2 text-start text-sm font-medium text-foreground">
					Roll {betType === 'over' ? 'Over' : 'Under'}
				</h3>
				<div class="relative">
					<Input
						type="number"
						value={rollTarget}
						step="0.01"
						min="0"
						max="100"
						class="border-border bg-background pr-8 text-left text-lg font-bold"
						oninput={onRollTargetChange}
						onblur={onRollTargetChange}
					/>
					<button
						class="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
						aria-label="Toggle Over/Under"
						onclick={onToggleBetType}
						type="button"
					>
						<RotateCcw class="h-4 w-4" />
					</button>
				</div>
			</div>

			<div>
				<h3 class="mb-2 text-start text-sm font-medium text-foreground">Win Chance</h3>
				<div class="relative">
					<Input
						type="number"
						value={winChance}
						step="0.0001"
						min="0"
						max="100"
						class="border-border bg-background pr-8 text-left text-lg font-bold"
						oninput={onWinChanceChange}
						onblur={onWinChanceChange}
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground"
					>
						<Percent class="h-4 w-4" />
					</div>
				</div>
			</div>
		</div>
	</CardContent>
</Card>
