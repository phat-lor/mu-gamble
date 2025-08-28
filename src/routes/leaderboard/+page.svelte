<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as m from '$lib/paraglide/messages';

	interface LeaderboardEntry {
		rank: number;
		username: string;
		totalWagered: number;
		totalProfit: number;
		biggestWin: number;
		winRate: number;
		totalBets: number;
		balance: number;
	}

	interface LeaderboardResponse {
		success: true;
		data: LeaderboardEntry[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalEntries: number;
			limit: number;
		};
	}

	// State
	let loading = true;
	let error = '';
	let leaderboardData: LeaderboardEntry[] = [];
	let pagination = {
		currentPage: 1,
		totalPages: 1,
		totalEntries: 0,
		limit: 20
	};

	// Filters
	let currentPage = 1;
	let timeframe = 'all';
	let metric = 'balance';
	let limit = 20;

	// Filter options
	const timeframeOptions = [
		{ value: 'all', label: m['leaderboard.timeframe.all']() },
		{ value: '24h', label: m['leaderboard.timeframe.24h']() },
		{ value: '7d', label: m['leaderboard.timeframe.7d']() },
		{ value: '30d', label: m['leaderboard.timeframe.30d']() }
	];

	const metricOptions = [
		{ value: 'total_wagered', label: m['leaderboard.metric.totalWagered']() },
		{ value: 'total_profit', label: m['leaderboard.metric.totalProfit']() },
		{ value: 'biggest_win', label: m['leaderboard.metric.biggestWin']() },
		{ value: 'win_rate', label: m['leaderboard.metric.winRate']() },
		{ value: 'balance', label: m['leaderboard.metric.balance']() }
	];

	// Initialize from URL params
	$: {
		const urlParams = $page.url.searchParams;
		currentPage = parseInt(urlParams.get('page') || '1');
		timeframe = urlParams.get('timeframe') || 'all';
		metric = urlParams.get('metric') || 'total_wagered';
		limit = parseInt(urlParams.get('limit') || '20');
	}

	// Fetch leaderboard data
	async function fetchLeaderboard() {
		try {
			loading = true;
			error = '';

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: limit.toString(),
				timeframe,
				metric
			});

			const response = await fetch(`/api/leaderboard?${params}`);
			const data: LeaderboardResponse = await response.json();

			if (data.success) {
				leaderboardData = data.data;
				pagination = data.pagination;
			} else {
				error = 'Failed to load leaderboard data';
			}
		} catch (err) {
			console.error('Error fetching leaderboard:', err);
			error = 'Failed to load leaderboard data';
		} finally {
			loading = false;
		}
	}

	// Update URL and fetch data
	function updateFilters() {
		const params = new URLSearchParams();
		if (currentPage > 1) params.set('page', currentPage.toString());
		if (timeframe !== 'all') params.set('timeframe', timeframe);
		if (metric !== 'total_wagered') params.set('metric', metric);
		if (limit !== 20) params.set('limit', limit.toString());

		const newUrl = params.toString() ? `/leaderboard?${params}` : '/leaderboard';
		goto(newUrl, { replaceState: true });
		fetchLeaderboard();
	}

	// Pagination handlers
	function handlePageChange(newPage: number) {
		currentPage = newPage;
		updateFilters();
	}

	// Filter handlers
	function handleTimeframeChange(value: string) {
		timeframe = value;
		currentPage = 1; // Reset to first page
		updateFilters();
	}

	function handleMetricChange(value: string) {
		metric = value;
		currentPage = 1; // Reset to first page
		updateFilters();
	}

	// Format values
	function formatCurrency(value: number): string {
		return value.toFixed(2);
	}

	function formatPercentage(value: number): string {
		return `${value.toFixed(1)}%`;
	}

	function formatCompactCurrency(value: number): string {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
		} else {
			return value.toFixed(2);
		}
	}

	function getRankColor(rank: number): string {
		switch (rank) {
			case 1:
				return 'text-yellow-600';
			case 2:
				return 'text-gray-500';
			case 3:
				return 'text-amber-600';
			default:
				return 'text-muted-foreground';
		}
	}

	// Initial load
	onMount(() => {
		fetchLeaderboard();
	});
</script>

<svelte:head>
	<title>{m['leaderboard.title']()} - MU888</title>
	<meta name="description" content={m['leaderboard.description']()} />
</svelte:head>

<div class="container mx-auto max-w-7xl space-y-6 px-6 py-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<h1 class="text-3xl font-medium tracking-tight">
					{m['leaderboard.title']()}
				</h1>
				<p class="text-sm text-muted-foreground">
					{m['leaderboard.subtitle']()}
				</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={fetchLeaderboard}
				disabled={loading}
				class="text-xs tracking-wide uppercase"
			>
				{m['common.refresh']()}
			</Button>
		</div>

		<!-- Filters -->
		<div
			class="flex flex-col gap-4 border-b border-border/20 pb-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
				<div class="flex items-center gap-4">
					<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>Period</span
					>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="sm"
									class="h-8 px-2 text-sm font-medium hover:bg-transparent hover:underline"
								>
									{timeframeOptions.find((o) => o.value === timeframe)?.label}
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-32">
							{#each timeframeOptions as option}
								<DropdownMenu.Item
									class="cursor-pointer text-sm {timeframe === option.value ? 'bg-accent' : ''}"
									onclick={() => handleTimeframeChange(option.value)}
								>
									{option.label}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<div class="flex items-center gap-4">
					<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>Rank by</span
					>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="sm"
									class="h-8 px-2 text-sm font-medium hover:bg-transparent hover:underline"
								>
									{metricOptions.find((o) => o.value === metric)?.label}
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-48">
							{#each metricOptions as option}
								<DropdownMenu.Item
									class="cursor-pointer text-sm {metric === option.value ? 'bg-accent' : ''}"
									onclick={() => handleMetricChange(option.value)}
								>
									{option.label}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if !loading && leaderboardData.length > 0}
				<div class="text-xs text-muted-foreground">
					{pagination.totalEntries} players
				</div>
			{/if}
		</div>
	</div>

	<!-- Content -->
	{#if error}
		<Card.Root>
			<Card.Content class="p-8 text-center">
				<div class="font-medium text-destructive">{error}</div>
				<Button onclick={fetchLeaderboard} class="mt-4">
					{m['common.retry']()}
				</Button>
			</Card.Content>
		</Card.Root>
	{:else if loading}
		<!-- Loading skeleton -->
		<div class="scrollbar-hide -mx-6 overflow-x-auto px-6">
			<div class="min-w-[900px] space-y-0">
				{#each Array(8) as _}
					<div
						class="grid grid-cols-9 gap-4 border-b border-border/10 py-4"
						style="grid-template-columns: 60px 1fr 100px 100px 100px 100px 80px 60px 80px;"
					>
						<div class="text-center">
							<Skeleton class="mx-auto h-4 w-8" />
						</div>
						<div>
							<Skeleton class="h-4 w-24" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
						<div class="text-right">
							<Skeleton class="ml-auto h-4 w-12" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if leaderboardData.length === 0}
		<div class="py-16 text-center">
			<p class="text-sm text-muted-foreground">
				{m['leaderboard.noDataDescription']()}
			</p>
		</div>
	{:else}
		<!-- Leaderboard Table -->
		<div class="scrollbar-hide -mx-6 overflow-x-auto px-6">
			<div class="min-w-[900px] space-y-0">
				<!-- Table Header -->
				<div
					class="grid grid-cols-9 gap-4 border-b border-border/20 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
					style="grid-template-columns: 60px 1fr 100px 100px 100px 100px 80px 60px 80px;"
				>
					<div class="text-center">Rank</div>
					<div>Player</div>
					<div class="text-right">Balance</div>
					<div class="text-right">Wagered</div>
					<div class="text-right">Profit</div>
					<div class="text-right">Best Win</div>
					<div class="text-right">Win Rate</div>
					<div class="text-right">Bets</div>
				</div>

				<!-- Table Body -->
				{#each leaderboardData as entry}
					<div
						class="grid grid-cols-9 gap-4 border-b border-border/5 py-3 transition-colors hover:bg-muted/20"
						style="grid-template-columns: 60px 1fr 100px 100px 100px 100px 80px 60px 80px;"
					>
						<div class="text-center">
							{#if entry.rank <= 3}
								<span class="text-sm font-semibold {getRankColor(entry.rank)}">
									{entry.rank}
								</span>
							{:else}
								<span class="text-sm text-muted-foreground">{entry.rank}</span>
							{/if}
						</div>
						<div class="flex min-w-0 items-center gap-3">
							<span class="truncate text-sm font-medium">{entry.username}</span>
							{#if entry.rank === 1}
								<span class="flex-shrink-0 text-xs text-muted-foreground">Leader</span>
							{/if}
						</div>
						<div class="text-right">
							<Tooltip.Root>
								<Tooltip.Trigger>
									<span class="font-mono text-sm font-semibold text-primary">
										{formatCompactCurrency(entry.balance)}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="font-mono text-sm">{formatCurrency(entry.balance)}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</div>
						<div class="text-right">
							<Tooltip.Root>
								<Tooltip.Trigger>
									<span class="font-mono text-sm">
										{formatCompactCurrency(entry.totalWagered)}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="font-mono text-sm">{formatCurrency(entry.totalWagered)}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</div>
						<div class="text-right">
							<Tooltip.Root>
								<Tooltip.Trigger>
									<span
										class="font-mono text-sm {entry.totalProfit >= 0
											? 'text-green-600'
											: 'text-red-600'}"
									>
										{entry.totalProfit >= 0 ? '+' : ''}{formatCompactCurrency(entry.totalProfit)}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p
										class="font-mono text-sm {entry.totalProfit >= 0
											? 'text-green-600'
											: 'text-red-600'}"
									>
										{entry.totalProfit >= 0 ? '+' : ''}{formatCurrency(entry.totalProfit)}
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</div>
						<div class="text-right">
							<Tooltip.Root>
								<Tooltip.Trigger>
									<span class="font-mono text-sm">
										{formatCompactCurrency(entry.biggestWin)}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="font-mono text-sm">{formatCurrency(entry.biggestWin)}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</div>
						<div class="text-right">
							<span
								class="font-mono text-sm {entry.winRate >= 50
									? 'text-green-600'
									: entry.winRate >= 40
										? 'text-yellow-600'
										: 'text-muted-foreground'}">{formatPercentage(entry.winRate)}</span
							>
						</div>
						<div class="text-right">
							<span class="font-mono text-sm text-muted-foreground"
								>{entry.totalBets.toLocaleString()}</span
							>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Pagination -->
		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-between border-t border-border/20 pt-4">
				<Button
					variant="ghost"
					size="sm"
					onclick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					class="text-xs tracking-wide uppercase"
				>
					Previous
				</Button>

				<div class="flex items-center gap-1">
					{#each Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
						const start = Math.max(1, currentPage - 3);
						const end = Math.min(pagination.totalPages, start + 6);
						const pageNum = start + i;
						return pageNum <= end ? pageNum : null;
					}).filter((p) => p !== null) as pageNum}
						<Button
							variant={pageNum === currentPage ? 'default' : 'ghost'}
							size="sm"
							onclick={() => handlePageChange(pageNum)}
							class="h-8 w-8 p-0 text-xs"
						>
							{pageNum}
						</Button>
					{/each}
				</div>

				<Button
					variant="ghost"
					size="sm"
					onclick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage >= pagination.totalPages}
					class="text-xs tracking-wide uppercase"
				>
					Next
				</Button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
