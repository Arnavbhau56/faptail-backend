/*
  Warnings:

  - You are about to drop the column `gst_amount` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "gst_amount",
ADD COLUMN     "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "platform_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "delivery_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "platform_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "state" TEXT;
