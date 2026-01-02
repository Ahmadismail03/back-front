/*
  Warnings:

  - You are about to drop the column `confidence_score` on the `voice_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `detected_intent` on the `voice_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `matched_service_id` on the `voice_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `raw_text` on the `voice_sessions` table. All the data in the column will be lost.
  - The `session_status` column on the `voice_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `voice_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "voice_sessions" DROP CONSTRAINT "voice_sessions_matched_service_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_sessions" DROP CONSTRAINT "voice_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "voice_sessions" DROP COLUMN "confidence_score",
DROP COLUMN "detected_intent",
DROP COLUMN "matched_service_id",
DROP COLUMN "raw_text",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "session_status",
ADD COLUMN     "session_status" TEXT NOT NULL DEFAULT 'ACTIVE';
