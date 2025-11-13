-- CreateTable
CREATE TABLE `chatbot_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `botId` INTEGER NULL,
    `conversation_id` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `integration` VARCHAR(50) NOT NULL,
    `total_messages` INTEGER NOT NULL DEFAULT 0,
    `user_messages` INTEGER NOT NULL DEFAULT 0,
    `bot_messages` INTEGER NOT NULL DEFAULT 0,
    `avg_message_length` DOUBLE NULL,
    `sentiment` VARCHAR(20) NULL,
    `keywords` TEXT NULL,
    `tags` TEXT NULL,
    `summary` TEXT NULL,
    `personal_contact_requested` INTEGER NOT NULL DEFAULT 0,
    `requested_contact_channel` VARCHAR(50) NULL,
    `customer_type` VARCHAR(50) NULL,
    `customer_region` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chatbot_analytics_conversation_id_key`(`conversation_id`),
    INDEX `chatbot_analytics_conversation_id_idx`(`conversation_id`),
    INDEX `chatbot_analytics_date_idx`(`date`),
    INDEX `chatbot_analytics_integration_idx`(`integration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
