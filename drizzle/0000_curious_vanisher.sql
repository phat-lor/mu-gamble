CREATE TABLE `bet` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_type` text NOT NULL,
	`amount` real NOT NULL,
	`multiplier` real NOT NULL,
	`win` integer NOT NULL,
	`payout` real DEFAULT 0 NOT NULL,
	`server_seed` text NOT NULL,
	`server_seed_hash` text NOT NULL,
	`client_seed` text NOT NULL,
	`nonce` integer NOT NULL,
	`game_data` text,
	`result` real NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `user_game_session` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_nonce` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
