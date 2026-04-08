CREATE TABLE `bankConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankName` varchar(100) NOT NULL,
	`bankCode` varchar(20) NOT NULL,
	`accountType` enum('checking','savings','investment') NOT NULL DEFAULT 'checking',
	`maskedAccount` varchar(30),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlyBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthId` varchar(7) NOT NULL,
	`snapshotJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthlyBackups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `transferToCaixaId` int;--> statement-breakpoint
ALTER TABLE `transactions` ADD `externalRef` varchar(255);--> statement-breakpoint
ALTER TABLE `transactions` ADD `bankName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('free','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `planExpiresAt` timestamp;