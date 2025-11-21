CREATE TABLE `artifactRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceArtifactId` int NOT NULL,
	`targetArtifactId` int NOT NULL,
	`relationshipType` varchar(50) NOT NULL,
	`mappingRules` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artifactRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phase` varchar(50) NOT NULL,
	`status` enum('not_started','in_progress','completed','reviewed') NOT NULL DEFAULT 'not_started',
	`content` text,
	`generatedContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`description` text NOT NULL,
	`rationale` text,
	`impact` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('active','validated','invalidated') NOT NULL DEFAULT 'active',
	`createdBy` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phase` varchar(50) NOT NULL,
	`artifactIds` text,
	`status` enum('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
	`generatedDocument` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`currentPhase` varchar(50) NOT NULL DEFAULT 'Preliminary',
	`status` enum('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questionnaireResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`questionText` text NOT NULL,
	`answer` text,
	`source` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questionnaireResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artifactRelationships` ADD CONSTRAINT `artifactRelationships_sourceArtifactId_artifacts_id_fk` FOREIGN KEY (`sourceArtifactId`) REFERENCES `artifacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artifactRelationships` ADD CONSTRAINT `artifactRelationships_targetArtifactId_artifacts_id_fk` FOREIGN KEY (`targetArtifactId`) REFERENCES `artifacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artifacts` ADD CONSTRAINT `artifacts_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assumptions` ADD CONSTRAINT `assumptions_artifactId_artifacts_id_fk` FOREIGN KEY (`artifactId`) REFERENCES `artifacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliverables` ADD CONSTRAINT `deliverables_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questionnaireResponses` ADD CONSTRAINT `questionnaireResponses_artifactId_artifacts_id_fk` FOREIGN KEY (`artifactId`) REFERENCES `artifacts`(`id`) ON DELETE cascade ON UPDATE no action;