<script lang="ts">
	import { userStore } from '$lib/stores/user-store';
	import type { PublicUser } from '$lib/server/auth';
	import { onMount } from 'svelte';

	interface Props {
		user: PublicUser | null;
		children: import('svelte').Snippet;
	}

	let { user, children }: Props = $props();

	onMount(() => {
		// Initialize the store with the user data from the server
		userStore.setUser(user);
	});

	// Update store when user prop changes
	$effect(() => {
		userStore.setUser(user);
	});
</script>

{@render children?.()}
