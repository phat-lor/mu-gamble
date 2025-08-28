<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import AppShell from '$lib/components/self/appshell.svelte';
	import UserProvider from '$lib/components/providers/user-provider.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		children: import('svelte').Snippet;
		data: LayoutData;
	}

	let { children, data }: Props = $props();
</script>

<svelte:head>
	<ModeWatcher />
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster position="top-center" richColors />
<UserProvider user={data.user}>
	<AppShell>
		{@render children?.()}
	</AppShell>
</UserProvider>
