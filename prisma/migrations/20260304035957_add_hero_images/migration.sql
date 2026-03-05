-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "hero_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
