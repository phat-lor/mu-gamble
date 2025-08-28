<script lang="ts">
	import { page } from '$app/stores';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from './app-sidebar.svelte';
	import type { PublicUser } from '$lib/server/db/schema';

	interface Props {
		children: import('svelte').Snippet;
		user: PublicUser | null;
	}

	let { children, user }: Props = $props();

	function getPageTitle(routeId: string | null): string {
		if (!routeId) return 'Home';

		const segments = routeId.split('/').filter(Boolean);
		if (segments.length === 0) return 'Home';

		const lastSegment = segments[segments.length - 1];
		return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
	}
</script>

<Sidebar.Provider>
	<AppSidebar {user} />

	<Sidebar.Inset class="sidebar-container">
		<header
			class="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex w-full items-center gap-4 px-4 lg:px-6">
				<Sidebar.Trigger class="-ml-1" />

				<h1 class="mr-6 text-base font-medium">
					{getPageTitle($page.route.id)}
				</h1>
			</div>
		</header>

		<div class="flex-1 overflow-auto bg-background">
			<div class="flex flex-col gap-2">
				<div class="flex flex-col gap-4 md:gap-6">
					<div class="px-4 md:py-4 lg:px-6">
						{@render children()}
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
