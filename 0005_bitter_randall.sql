CREATE TABLE `academyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventName` varchar(100) NOT NULL,
	`eventDate` datetime NOT NULL,
	`eventType` enum('holiday','event','notice','other') NOT NULL DEFAULT 'other',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academyEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `examSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examName` varchar(100) NOT NULL,
	`examDate` datetime NOT NULL,
	`subject` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tuitionPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paidAmount` decimal(10,2) NOT NULL DEFAULT 0,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`dueDate` datetime,
	`paidDate` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tuitionPayments_id` PRIMARY KEY(`id`)
);
