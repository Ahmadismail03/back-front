/*
  Warnings:

  - Made the column `family_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `first_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `second_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `third_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "family_name" SET NOT NULL,
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "second_name" SET NOT NULL,
ALTER COLUMN "third_name" SET NOT NULL;
