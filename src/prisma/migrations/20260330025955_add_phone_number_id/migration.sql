/*
  Warnings:

  - You are about to drop the column `phone` on the `Tenant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumberId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Tenant_phone_key";

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "phone",
ADD COLUMN     "phoneNumberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_phoneNumberId_key" ON "Tenant"("phoneNumberId");
