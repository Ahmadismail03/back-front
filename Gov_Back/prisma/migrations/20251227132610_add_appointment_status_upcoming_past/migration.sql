BEGIN;

-- 1) status كـ TEXT (بدون enum)
ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'UPCOMING';

-- 2) updated_at مع default
ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- 3) احذف unique القديم إن وجد
DROP INDEX IF EXISTS "appointments_user_id_service_id_key";

-- 4) partial unique index (هذا أهم سطر)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_upcoming_appointment_per_service"
ON "appointments" ("user_id", "service_id")
WHERE "status" = 'UPCOMING';

COMMIT;
