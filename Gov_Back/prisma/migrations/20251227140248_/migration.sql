-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropEnum
DROP TYPE "AppointmentStatus";

-- CreateIndex
CREATE INDEX "appointments_user_id_appointment_date_idx" ON "appointments"("user_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_user_id_service_id_status_idx" ON "appointments"("user_id", "service_id", "status");
