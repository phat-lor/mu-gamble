<script lang="ts">
	interface Props {
		coinRotation: number;
	}

	let { coinRotation }: Props = $props();
</script>

<div class="flex justify-center">
	<div class="coin-container">
		<div class="coin" style="transform: rotateY({coinRotation}deg)">
			<div class="coin-face coin-cat">
				<img src="/games/flip/cat_coin.png" alt="Cat" class="h-64 w-64 object-contain" />
			</div>
			<div class="coin-face coin-dog">
				<img src="/games/flip/dog_coin.png" alt="Dog" class="h-64 w-64 object-contain" />
			</div>
		</div>
	</div>
</div>

<style>
	.coin-container {
		position: relative;
		width: 100%;
		height: 100%;
		perspective: 1000px;
	}

	.coin {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
		transition: transform 1s ease-in-out;
	}

	.coin-face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.coin-cat {
		transform: rotateY(0deg);
	}

	.coin-dog {
		transform: rotateY(180deg);
	}
</style>
