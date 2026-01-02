/*
  Warnings:

  - You are about to drop the column `suggested_services` on the `service_suggestions` table. All the data in the column will be lost.
  - Changed the type of `appointment_time` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `suggestedServices` to the `service_suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "service_documents" DROP CONSTRAINT "service_documents_service_id_fkey";

-- DropIndex
DROP INDEX "appointments_service_id_idx";

-- DropIndex
DROP INDEX "appointments_user_id_idx";

-- DropIndex
DROP INDEX "audit_logs_admin_id_idx";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- DropIndex
DROP INDEX "otp_requests_user_id_idx";

-- DropIndex
DROP INDEX "idx_service_documents_service_id";

-- DropIndex
DROP INDEX "idx_service_documents_service_sort";

-- DropIndex
DROP INDEX "voice_sessions_matched_service_id_idx";

-- DropIndex
DROP INDEX "voice_sessions_user_id_idx";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "appointment_date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "appointment_time",
ADD COLUMN     "appointment_time" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "service_suggestions" DROP COLUMN "suggested_services",
ADD COLUMN     "suggestedServices" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "embedding" DROP DEFAULT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "service_documents" ADD CONSTRAINT "service_documents_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
