import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	balance: real('balance').notNull().default(1000),
	isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false)
});

export const bet = sqliteTable('bet', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	gameType: text('game_type', { enum: ['dice', 'flip'] }).notNull(),
	amount: real('amount').notNull(),
	multiplier: real('multiplier').notNull(),
	win: integer('win', { mode: 'boolean' }).notNull(),
	payout: real('payout').notNull().default(0),

	// Provably fair fields
	serverSeed: text('server_seed').notNull(),
	serverSeedHash: text('server_seed_hash').notNull(),
	clientSeed: text('client_seed').notNull(),
	nonce: integer('nonce').notNull(),

	// Game-specific data
	gameData: text('game_data', { mode: 'json' }), // JSON field for game-specific parameters
	result: real('result').notNull(), // Dice roll value or flip result (0=cat, 1=dog)

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// User sessions for tracking nonce per user
export const userGameSession = sqliteTable('user_game_session', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id),
	currentNonce: integer('current_nonce').notNull().default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent')
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Bet = typeof bet.$inferSelect;
export type UserGameSession = typeof userGameSession.$inferSelect;
export type PublicUser = Omit<User, 'passwordHash'>;
