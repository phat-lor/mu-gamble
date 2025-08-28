<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { UserIcon, LockIcon, AlertCircle } from '@lucide/svelte/icons';
	import { goto, invalidateAll } from '$app/navigation';
	import { authenticate } from '$lib/utils/auth-api';
	import { handleApiResponse, validation } from '$lib/utils/error-handling';

	interface Props {
		open?: boolean;
		children?: import('svelte').Snippet<[{ props: Record<string, unknown> }]>;
	}

	let { open = $bindable(false), children }: Props = $props();

	let isLoading = $state(false);
	let activeTab = $state('login');
	let errorMessage = $state('');

	async function handleSubmit(action: 'login' | 'register', formData: FormData) {
		isLoading = true;
		errorMessage = '';

		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		// Client-side validation
		const usernameValidation = validation.username(username);
		if (!usernameValidation.valid) {
			errorMessage = usernameValidation.error!;
			isLoading = false;
			return;
		}

		const passwordValidation = validation.password(password);
		if (!passwordValidation.valid) {
			errorMessage = passwordValidation.error!;
			isLoading = false;
			return;
		}

		// Make API call
		const response = await authenticate({
			action,
			username,
			password
		});

		const result = handleApiResponse(response, {
			showErrorToast: false, // We'll handle errors manually for better UX
			onSuccess: async () => {
				open = false;
				await invalidateAll(); // Refresh user data
			},
			onError: (error) => {
				errorMessage = error;
			}
		});

		isLoading = false;
	}

	function switchTab(tab: string) {
		activeTab = tab;
		errorMessage = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{#if children}
				{@render children({ props })}
			{:else}
				<Button {...props} variant="default" size="sm">
					<UserIcon class="mr-2 size-4" />
					Sign In
				</Button>
			{/if}
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Overlay class="bg-background/20 backdrop-blur-sm" />
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Welcome</Dialog.Title>
			<Dialog.Description>
				Sign in to your account or create a new one to get started.
			</Dialog.Description>
		</Dialog.Header>

		<Tabs.Root value={activeTab} onValueChange={switchTab}>
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="login">Sign In</Tabs.Trigger>
				<Tabs.Trigger value="register">Sign Up</Tabs.Trigger>
			</Tabs.List>

			<!-- Login Tab -->
			<Tabs.Content value="login" class="space-y-4">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit('login', new FormData(e.target as HTMLFormElement));
					}}
				>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="login-username">Username</Label>
							<div class="relative">
								<UserIcon class="absolute top-3 left-3 size-4 text-muted-foreground" />
								<Input
									id="login-username"
									name="username"
									placeholder="Enter your username"
									class="pl-10"
									required
									disabled={isLoading}
								/>
							</div>
						</div>
						<div class="space-y-2">
							<Label for="login-password">Password</Label>
							<div class="relative">
								<LockIcon class="absolute top-3 left-3 size-4 text-muted-foreground" />
								<Input
									id="login-password"
									name="password"
									type="password"
									placeholder="Enter your password"
									class="pl-10"
									required
									disabled={isLoading}
								/>
							</div>
						</div>

						{#if errorMessage}
							<div
								class="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
							>
								<AlertCircle class="size-4" />
								{errorMessage}
							</div>
						{/if}

						<Button type="submit" class="w-full" disabled={isLoading}>
							{#if isLoading}
								<div
									class="mr-2 size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
								></div>
							{/if}
							Sign In
						</Button>
					</div>
				</form>
			</Tabs.Content>

			<!-- Register Tab -->
			<Tabs.Content value="register" class="space-y-4">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit('register', new FormData(e.target as HTMLFormElement));
					}}
				>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="register-username">Username</Label>
							<div class="relative">
								<UserIcon class="absolute top-3 left-3 size-4 text-muted-foreground" />
								<Input
									id="register-username"
									name="username"
									placeholder="Choose a username"
									class="pl-10"
									required
									disabled={isLoading}
								/>
							</div>
							<p class="text-xs text-muted-foreground">
								3-31 characters, letters (a-z, A-Z), numbers, underscore, and dash only
							</p>
						</div>
						<div class="space-y-2">
							<Label for="register-password">Password</Label>
							<div class="relative">
								<LockIcon class="absolute top-3 left-3 size-4 text-muted-foreground" />
								<Input
									id="register-password"
									name="password"
									type="password"
									placeholder="Create a password"
									class="pl-10"
									required
									disabled={isLoading}
								/>
							</div>
							<p class="text-xs text-muted-foreground">Minimum 6 characters</p>
						</div>

						{#if errorMessage}
							<div
								class="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
							>
								<AlertCircle class="size-4" />
								{errorMessage}
							</div>
						{/if}

						<Button type="submit" class="w-full" disabled={isLoading}>
							{#if isLoading}
								<div
									class="mr-2 size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
								></div>
							{/if}
							Create Account
						</Button>
					</div>
				</form>
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
