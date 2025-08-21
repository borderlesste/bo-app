-- Add PayPal-specific fields to existing tables for complete integration

-- Add PayPal order ID and capture ID to pedidos table
ALTER TABLE `pedidos` 
ADD COLUMN `paypal_order_id` VARCHAR(255) NULL AFTER `numero_pedido`,
ADD COLUMN `paypal_capture_id` VARCHAR(255) NULL AFTER `paypal_order_id`,
ADD COLUMN `payment_method` ENUM('paypal', 'stripe', 'bank_transfer', 'cash') NULL DEFAULT 'paypal' AFTER `paypal_capture_id`;

-- Add PayPal transaction details to pagos table
ALTER TABLE `pagos` 
ADD COLUMN `paypal_order_id` VARCHAR(255) NULL AFTER `referencia`,
ADD COLUMN `paypal_capture_id` VARCHAR(255) NULL AFTER `paypal_order_id`,
ADD COLUMN `paypal_payer_email` VARCHAR(255) NULL AFTER `paypal_capture_id`,
ADD COLUMN `payment_gateway` ENUM('paypal', 'stripe', 'manual') DEFAULT 'manual' AFTER `metodo_pago`;

-- Create webhooks_paypal table for PayPal webhook events
CREATE TABLE IF NOT EXISTS `webhooks_paypal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `webhook_id` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `event_id` VARCHAR(255) NOT NULL,
  `resource_type` VARCHAR(50) NOT NULL,
  `resource_id` VARCHAR(255) NOT NULL,
  `status` ENUM('received', 'processed', 'failed', 'ignored') DEFAULT 'received',
  `order_id` VARCHAR(255) NULL,
  `capture_id` VARCHAR(255) NULL,
  `amount` DECIMAL(12,2) NULL,
  `currency` VARCHAR(3) NULL,
  `payer_email` VARCHAR(255) NULL,
  `verification_status` ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
  `raw_payload` LONGTEXT NULL,
  `processing_error` TEXT NULL,
  `processed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_id` (`event_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_capture_id` (`capture_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
ALTER TABLE `pedidos` 
ADD INDEX `idx_paypal_order_id` (`paypal_order_id`),
ADD INDEX `idx_paypal_capture_id` (`paypal_capture_id`);

ALTER TABLE `pagos` 
ADD INDEX `idx_paypal_order_id` (`paypal_order_id`),
ADD INDEX `idx_paypal_capture_id` (`paypal_capture_id`);