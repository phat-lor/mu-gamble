<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Languages } from '@lucide/svelte/icons';
	import { getLocale, setLocale, locales, type Locale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	let currentLocale = $state(getLocale());

	const languageNames: Record<Locale, string> = {
		en: 'English',
		th: 'ไทย'
	};

	function handleLocaleChange(newLocale: Locale) {
		console.log('🌐 Changing locale from', currentLocale, 'to', newLocale);
		setLocale(newLocale, { reload: false });
		currentLocale = newLocale;

		// Force a page reload to ensure all components update
		if (typeof window !== 'undefined') {
			console.log('🔄 Reloading page...');
			window.location.reload();
		}
	}

	// Watch for locale changes and update the current locale
	$effect(() => {
		const locale = getLocale();
		if (locale !== currentLocale) {
			currentLocale = locale;
		}
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm" class="h-8 w-8 p-0">
				<Languages class="h-4 w-4" />
				<span class="sr-only">{m['common.language']()}</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-40">
		<DropdownMenu.Label>{m['common.language']()}</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#each locales as locale}
			<DropdownMenu.Item
				class="cursor-pointer {currentLocale === locale ? 'bg-accent' : ''}"
				onclick={() => handleLocaleChange(locale)}
			>
				<span class="flex items-center gap-2">
					{#if currentLocale === locale}
						<span class="text-primary">●</span>
					{:else}
						<span class="w-4"></span>
					{/if}
					{languageNames[locale]}
				</span>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
