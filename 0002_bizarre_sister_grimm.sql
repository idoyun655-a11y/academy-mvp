CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`mockExamMonth` enum('3','6','9','10'),
	`korean` tinyint,
	`english` tinyint,
	`math` tinyint,
	`science` tinyint,
	`social` tinyint,
	`schoolGrade` tinyint,
	`schoolGradeType` enum('5','9'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
