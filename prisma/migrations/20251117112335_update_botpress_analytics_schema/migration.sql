-- Delete existing data to allow schema changes
DELETE FROM `botpress_analytics`;

-- Rename botId to bot_id and make it required (if botId exists)
-- If bot_id already exists, just modify it to be NOT NULL
SET @botid_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'botId');

SET @bot_id_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'bot_id');

SET @sql = IF(@botid_exists > 0 AND @bot_id_exists = 0,
  'ALTER TABLE `botpress_analytics` CHANGE COLUMN `botId` `bot_id` VARCHAR(191) NOT NULL',
  IF(@bot_id_exists > 0,
    'ALTER TABLE `botpress_analytics` MODIFY COLUMN `bot_id` VARCHAR(191) NOT NULL',
    'ALTER TABLE `botpress_analytics` ADD COLUMN `bot_id` VARCHAR(191) NOT NULL'));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable: Add date column (if it doesn't exist)
SET @date_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'date');

SET @sql = IF(@date_exists = 0,
  'ALTER TABLE `botpress_analytics` ADD COLUMN `date` DATE NOT NULL',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable: Add sync_date column (if it doesn't exist)
SET @sync_date_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'sync_date');

SET @sql = IF(@sync_date_exists = 0,
  'ALTER TABLE `botpress_analytics` ADD COLUMN `sync_date` DATE NOT NULL',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable: Add hourly_records_count column (if it doesn't exist)
SET @hourly_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'hourly_records_count');

SET @sql = IF(@hourly_exists = 0,
  'ALTER TABLE `botpress_analytics` ADD COLUMN `hourly_records_count` INTEGER NOT NULL DEFAULT 0',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- DropTable: Remove old columns (indexes will be automatically dropped) if they exist
SET @rangelabel_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'rangeLabel');

SET @sql = IF(@rangelabel_exists > 0,
  'ALTER TABLE `botpress_analytics` DROP COLUMN `rangeLabel`',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @start_datetime_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'start_datetime_utc');

SET @sql = IF(@start_datetime_exists > 0,
  'ALTER TABLE `botpress_analytics` DROP COLUMN `start_datetime_utc`',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @end_datetime_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'botpress_analytics' 
  AND COLUMN_NAME = 'end_datetime_utc');

SET @sql = IF(@end_datetime_exists > 0,
  'ALTER TABLE `botpress_analytics` DROP COLUMN `end_datetime_utc`',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
CREATE INDEX `botpress_analytics_bot_id_idx` ON `botpress_analytics`(`bot_id`);

-- CreateIndex
CREATE INDEX `botpress_analytics_date_idx` ON `botpress_analytics`(`date`);

-- CreateIndex
CREATE INDEX `botpress_analytics_sync_date_idx` ON `botpress_analytics`(`sync_date`);

