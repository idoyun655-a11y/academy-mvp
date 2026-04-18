ALTER TABLE `tuitionPayments` MODIFY COLUMN `paidAmount` decimal(10,2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `academyEvents` ADD `eventEndDate` datetime;--> statement-breakpoint
ALTER TABLE `examSchedules` ADD `examEndDate` datetime;