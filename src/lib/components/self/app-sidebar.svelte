<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import {
		HomeIcon,
		TrophyIcon,
		BellIcon,
		InfoIcon,
		ChevronsUpDownIcon,
		LogOutIcon,
		MoonIcon,
		DicesIcon,
		SunIcon,
		SettingsIcon,
		UserIcon,
		CoinsIcon
	} from '@lucide/svelte/icons';
	import { mode, setMode } from 'mode-watcher';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { goto, invalidateAll } from '$app/navigation';
	import AuthDialog from './auth-dialog.svelte';
	import type { PublicUser } from '$lib/server/db/schema';
	import { userStore } from '$lib/stores/user-store';

	// Subscribe to the user store
	$: userState = $userStore;
	$: user = userState.user;

	// Structured navigation map
	const navMap = [
		{
			title: 'Main',
			items: [
				{ name: 'Home', href: '/', icon: HomeIcon },
				{ name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
				{ name: 'Notifications', href: '/notifications', icon: BellIcon },
				{ name: 'About', href: '/about', icon: InfoIcon }
			]
		},
		{
			title: 'Games',
			items: [
				{ name: 'Dice', href: '/game/dice', icon: DicesIcon },
				{ name: 'Flip', href: '/game/flip', icon: CoinsIcon }
			]
		}
	];

	// User menu items
	const userMenuItems = [
		{
			title: 'Profile & Settings',
			items: [
				{ name: 'Account', href: '/profile', icon: UserIcon, action: 'profile' },
				{ name: 'Settings', href: '/settings', icon: SettingsIcon, action: 'settings' }
			]
		},
		{
			title: 'Features',
			items: [
				{
					name: 'Theme Toggle',
					href: '#',
					icon: mode.current === 'light' ? MoonIcon : SunIcon,
					action: 'theme'
				}
			]
		}
	];

	type MenuButtonProps = HTMLAttributes<HTMLAnchorElement | HTMLButtonElement>;

	const { setOpenMobile, isMobile } = useSidebar();

	function handleNavClick(name: string) {
		setOpenMobile(false);
	}

	function handleModeToggle() {
		setMode(mode.current === 'light' ? 'dark' : 'light');
	}

	function handleUserMenuAction(action: string) {
		switch (action) {
			case 'profile':
				goto('/profile');
				break;
			case 'settings':
				goto('/settings');
				break;
			case 'theme':
				handleModeToggle();
				break;
		}
		setOpenMobile(false);
	}

	async function handleSignOut() {
		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				await invalidateAll();
				goto('/');
			}
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header>
		<div class="flex items-center gap-2 p-2">
			<img src="/images/brand.png" alt="MU888" class="size-6" />
			<span class="text-base font-semibold">MU888</span>
			{#if user?.isAdmin}
				<Badge variant="secondary" class="text-xs">Admin</Badge>
			{/if}
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="space-y-4">
		<!-- Main Navigation -->
		{#each navMap as section}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{section.title}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each section.items as item}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props }: { props: MenuButtonProps })}
										<a
											href={item.href}
											onclick={() => handleNavClick(item.name)}
											class={`${props.class} group relative transition-all duration-200 hover:bg-accent hover:text-accent-foreground`}
										>
											<item.icon class="size-4" />
											<span class="font-medium">{item.name}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				{#if user}
					<!-- Authenticated User -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuButton
									size="lg"
									class="transition-all duration-200 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									{...props}
								>
									<Avatar.Root class="size-8 rounded-lg ring-2 ring-background">
										<Avatar.Fallback
											class="rounded-lg bg-primary font-medium text-primary-foreground"
										>
											{user.username.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">{user.username}</span>
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<CoinsIcon class="size-3" />
											<span>{user.balance.toFixed(2)}</span>
										</div>
									</div>
									<ChevronsUpDownIcon
										class="ml-auto size-4 text-muted-foreground transition-transform duration-200"
									/>
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg p-2 shadow-lg"
							side={'top'}
							align="end"
							sideOffset={4}
						>
							<DropdownMenu.Label class="p-0 font-normal">
								<div class="flex items-center gap-3 px-2 py-2 text-left">
									<Avatar.Root class="size-10 rounded-lg ring-2 ring-background">
										<Avatar.Fallback
											class="rounded-lg bg-primary font-medium text-primary-foreground"
										>
											{user.username.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-semibold">@{user.username}</span>
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<CoinsIcon class="size-3" />
											<span>Balance: {user.balance.toFixed(2)}</span>
										</div>
									</div>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />

							<!-- User Menu Sections -->
							{#each userMenuItems as section}
								<DropdownMenu.Group>
									{#each section.items as item}
										<DropdownMenu.Item
											onclick={() => handleUserMenuAction(item.action)}
											class="cursor-pointer transition-colors duration-200 hover:bg-accent"
										>
											<item.icon class="size-4" />
											{item.name}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
								<DropdownMenu.Separator />
							{/each}

							<!-- Sign Out -->
							<DropdownMenu.Item
								onclick={handleSignOut}
								class="cursor-pointer text-destructive transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
							>
								<LogOutIcon class="size-4" />
								Log out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<!-- Not Authenticated -->
					<AuthDialog>
						{#snippet children({ props })}
							<Sidebar.MenuButton {...props} size="lg">
								<UserIcon class="size-4" />
								<span class="font-medium">Sign In</span>
							</Sidebar.MenuButton>
						{/snippet}
					</AuthDialog>
				{/if}
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
