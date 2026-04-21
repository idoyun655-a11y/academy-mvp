ALTER TABLE `students` ADD `attendancePin` varchar(4);--> statement-breakpoint
CREATE UNIQUE INDEX `students_attendancePin_unique` ON `students` (`attendancePin`);--> statement-breakpoint
CREATE TABLE `commuteLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`commuteDate` varchar(10) NOT NULL,
	`checkInAt` datetime,
	`checkOutAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commuteLogs_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE UNIQUE INDEX `commuteLogs_studentId_commuteDate_unique` ON `commuteLogs` (`studentId`,`commuteDate`);
