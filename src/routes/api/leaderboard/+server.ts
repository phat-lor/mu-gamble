import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bet, user } from '$lib/server/db/schema';
import { sql, desc, eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';

// Request validation schema
const leaderboardParamsSchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	timeframe: z.enum(['all', '24h', '7d', '30d']).default('all'),
	metric: z.enum(['total_wagered', 'total_profit', 'biggest_win', 'win_rate']).default('total_wagered')
});

export interface LeaderboardEntry {
	rank: number;
	username: string;
	totalWagered: number;
	totalProfit: number;
	biggestWin: number;
	winRate: number;
	totalBets: number;
}

export interface LeaderboardResponse {
	success: true;
	data: LeaderboardEntry[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalEntries: number;
		limit: number;
	};
}

function getTimeframeFilter(timeframe: string) {
	const now = new Date();
	switch (timeframe) {
		case '24h':
			return gte(bet.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000));
		case '7d':
			return gte(bet.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
		case '30d':
			return gte(bet.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
		default:
			return undefined;
	}
}

function getOrderByClause(metric: string) {
	switch (metric) {
		case 'total_profit':
			return desc(sql`total_profit`);
		case 'biggest_win':
			return desc(sql`biggest_win`);
		case 'win_rate':
			return desc(sql`win_rate`);
		default: // total_wagered
			return desc(sql`total_wagered`);
	}
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse and validate query parameters
		const params = leaderboardParamsSchema.parse({
			page: url.searchParams.get('page'),
			limit: url.searchParams.get('limit'),
			timeframe: url.searchParams.get('timeframe'),
			metric: url.searchParams.get('metric')
		});

		const { page, limit, timeframe, metric } = params;
		const offset = (page - 1) * limit;

		// Build time filter
		const timeFilter = getTimeframeFilter(timeframe);

		// Build the base query for leaderboard statistics
		const baseQuery = db
			.select({
				userId: bet.userId,
				username: user.username,
				totalWagered: sql<number>`COALESCE(SUM(${bet.amount}), 0)`.as('total_wagered'),
				totalProfit: sql<number>`COALESCE(SUM(${bet.payout}) - SUM(${bet.amount}), 0)`.as('total_profit'),
				biggestWin: sql<number>`COALESCE(MAX(${bet.payout}), 0)`.as('biggest_win'),
				totalBets: sql<number>`COUNT(*)`.as('total_bets'),
				totalWins: sql<number>`SUM(CASE WHEN ${bet.win} = 1 THEN 1 ELSE 0 END)`.as('total_wins'),
				winRate: sql<number>`CASE WHEN COUNT(*) > 0 THEN ROUND((SUM(CASE WHEN ${bet.win} = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) ELSE 0 END`.as('win_rate')
			})
			.from(bet)
			.innerJoin(user, eq(bet.userId, user.id))
			.groupBy(bet.userId, user.username)
			.having(sql`COUNT(*) >= 5`); // Only show users with at least 5 bets

		// Add time filter if specified
		let query = baseQuery;
		if (timeFilter) {
			query = query.where(timeFilter) as typeof baseQuery;
		}

		// Get total count for pagination
		const countQuery = db
			.select({
				count: sql<number>`COUNT(DISTINCT ${bet.userId})`
			})
			.from(bet)
			.innerJoin(user, eq(bet.userId, user.id));

		let countQueryWithFilter = countQuery;
		if (timeFilter) {
			countQueryWithFilter = countQuery.where(timeFilter) as typeof countQuery;
		}

		// Add having clause for count query
		const totalCountResult = await db
			.select({
				count: sql<number>`COUNT(*)`
			})
			.from(
				countQueryWithFilter
					.having(sql`COUNT(*) >= 5`)
					.as('subquery')
			);

		const totalEntries = totalCountResult[0]?.count || 0;
		const totalPages = Math.ceil(totalEntries / limit);

		// Get leaderboard data with pagination and ordering
		const leaderboardData = await query
			.orderBy(getOrderByClause(metric))
			.limit(limit)
			.offset(offset);

		// Transform data and add ranks
		const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
			rank: offset + index + 1,
			username: entry.username,
			totalWagered: Math.round(entry.totalWagered * 100) / 100,
			totalProfit: Math.round(entry.totalProfit * 100) / 100,
			biggestWin: Math.round(entry.biggestWin * 100) / 100,
			winRate: entry.winRate,
			totalBets: entry.totalBets
		}));

		const response: LeaderboardResponse = {
			success: true,
			data: leaderboard,
			pagination: {
				currentPage: page,
				totalPages,
				totalEntries,
				limit
			}
		};

		return json(response);
	} catch (error) {
		console.error('Leaderboard API error:', error);
		
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'Invalid parameters', details: error.errors },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
