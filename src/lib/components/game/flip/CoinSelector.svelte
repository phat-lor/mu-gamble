<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	interface Props {
		selectedSide: 'cat' | 'dog';
		isFlipping: boolean;
		onSideSelect: (side: 'cat' | 'dog') => void;
	}

	let { selectedSide, isFlipping, onSideSelect }: Props = $props();
</script>

<div class="space-y-2">
	<div class="text-sm font-medium text-foreground">Choose Side</div>
	<div class="grid grid-cols-2 gap-2">
		<Button
			variant={selectedSide === 'cat' ? 'default' : 'outline'}
			class="border-border {selectedSide === 'cat'
				? 'bg-primary text-primary-foreground'
				: 'text-foreground hover:bg-muted'}"
			onclick={() => onSideSelect('cat')}
			disabled={isFlipping}
		>
			Cat
		</Button>
		<Button
			variant={selectedSide === 'dog' ? 'default' : 'outline'}
			class="border-border {selectedSide === 'dog'
				? 'bg-primary text-primary-foreground'
				: 'text-foreground hover:bg-muted'}"
			onclick={() => onSideSelect('dog')}
			disabled={isFlipping}
		>
			Dog
		</Button>
	</div>
</div>
