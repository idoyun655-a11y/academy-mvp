ALTER TABLE `students` ADD `schoolLevel` enum('elementary','middle','high','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `students` ADD `gradeLevel` int;--> statement-breakpoint
ALTER TABLE `students` ADD `lifecycleStatus` enum('active','on_hold','leaving','ended') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `students` ADD `followUpStatus` enum('none','needs_contact','scheduled','done') NOT NULL DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `students` ADD `followUpDueDate` datetime;
