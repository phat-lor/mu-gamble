PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`balance` real DEFAULT 1000 NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "username", "password_hash", "balance", "is_admin") SELECT "id", "username", "password_hash", "balance", "is_admin" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);