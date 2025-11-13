-- CreateTable
CREATE TABLE `botpress_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `botId` VARCHAR(191) NULL,
    `rangeLabel` VARCHAR(50) NOT NULL,
    `start_datetime_utc` DATETIME(3) NOT NULL,
    `end_datetime_utc` DATETIME(3) NOT NULL,
    `returning_users` INTEGER NOT NULL DEFAULT 0,
    `new_users` INTEGER NOT NULL DEFAULT 0,
    `sessions` INTEGER NOT NULL DEFAULT 0,
    `total_messages` INTEGER NOT NULL DEFAULT 0,
    `user_messages` INTEGER NOT NULL DEFAULT 0,
    `bot_messages` INTEGER NOT NULL DEFAULT 0,
    `events` INTEGER NOT NULL DEFAULT 0,
    `event_types` TEXT NULL,
    `llm_calls` INTEGER NOT NULL DEFAULT 0,
    `llm_errors` INTEGER NOT NULL DEFAULT 0,
    `llm_input_tokens` INTEGER NOT NULL DEFAULT 0,
    `llm_output_tokens` INTEGER NOT NULL DEFAULT 0,
    `llm_latency_mean` DOUBLE NULL,
    `llm_cost_sum` DOUBLE NULL DEFAULT 0,
    `llm_cost_mean` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `botpress_analytics_rangeLabel_idx`(`rangeLabel`),
    INDEX `botpress_analytics_start_datetime_utc_idx`(`start_datetime_utc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
