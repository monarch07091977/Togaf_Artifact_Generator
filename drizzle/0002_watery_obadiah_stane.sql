CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`vendor` varchar(255),
	`version` varchar(50),
	`lifecycle` enum('plan','build','run','retire') NOT NULL DEFAULT 'run',
	`category` varchar(100),
	`criticality` enum('low','medium','high','critical') DEFAULT 'medium',
	`owner` varchar(255),
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artifactEntityLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`section` varchar(255),
	`context` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artifactEntityLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessCapabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`level` int NOT NULL,
	`parentId` int,
	`maturityLevel` varchar(50),
	`owner` varchar(255),
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessCapabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessProcesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`processType` varchar(100),
	`owner` varchar(255),
	`automationLevel` varchar(50),
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessProcesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataEntities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`classification` varchar(100),
	`sensitivity` enum('public','internal','confidential','restricted') DEFAULT 'internal',
	`owner` varchar(255),
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataEntities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eaRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sourceEntityType` varchar(50) NOT NULL,
	`sourceEntityId` int NOT NULL,
	`relationshipType` varchar(100) NOT NULL,
	`targetEntityType` varchar(50) NOT NULL,
	`targetEntityId` int NOT NULL,
	`properties` text,
	`confidence` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eaRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(50) NOT NULL,
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('proposed','approved','implemented','verified') DEFAULT 'proposed',
	`source` varchar(255),
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artifactEntityLinks` ADD CONSTRAINT `artifactEntityLinks_artifactId_artifacts_id_fk` FOREIGN KEY (`artifactId`) REFERENCES `artifacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businessCapabilities` ADD CONSTRAINT `businessCapabilities_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businessProcesses` ADD CONSTRAINT `businessProcesses_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataEntities` ADD CONSTRAINT `dataEntities_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eaRelationships` ADD CONSTRAINT `eaRelationships_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirements_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;