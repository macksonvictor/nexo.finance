CREATE TABLE `aiUsageEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthId` varchar(7),
	`plan` enum('free','premium','pro','elite') NOT NULL,
	`mode` enum('chat','risk','indicators','predict','recommendations') NOT NULL,
	`sourceView` enum('dashboard','caixas','metas','historico','ia') NOT NULL,
	`windowType` enum('day','month') NOT NULL,
	`windowKey` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiUsageEvents_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE INDEX `aiUsageEvents_user_window_idx` ON `aiUsageEvents` (`userId`,`windowType`,`windowKey`);
