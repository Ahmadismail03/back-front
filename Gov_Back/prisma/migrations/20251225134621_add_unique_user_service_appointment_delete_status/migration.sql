/*
  Warnings:

  - You are about to drop the column `status` on the `appointments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,service_id]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "status";

-- CreateIndex
CREATE UNIQUE INDEX "appointments_user_id_service_id_key" ON "appointments"("user_id", "service_id");
