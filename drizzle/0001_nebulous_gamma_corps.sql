CREATE TABLE `caixas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`icon` varchar(10) NOT NULL DEFAULT '📦',
	`allocated` double NOT NULL DEFAULT 0,
	`spent` double NOT NULL DEFAULT 0,
	`color` varchar(20) NOT NULL DEFAULT '#F5F5F5',
	`category` enum('essencial','investimento','lazer','reserva','outro') NOT NULL DEFAULT 'outro',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caixas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`targetAmount` double NOT NULL DEFAULT 0,
	`currentAmount` double NOT NULL DEFAULT 0,
	`deadline` timestamp NOT NULL,
	`icon` varchar(10) NOT NULL DEFAULT '🎯',
	`color` varchar(20) NOT NULL DEFAULT '#F5F5F5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `months` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthId` varchar(7) NOT NULL,
	`income` double NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `months_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caixaId` int NOT NULL,
	`userId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` double NOT NULL,
	`type` enum('expense','income','transfer') NOT NULL DEFAULT 'expense',
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
