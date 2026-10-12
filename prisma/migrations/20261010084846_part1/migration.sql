/*
  Warnings:

  - A unique constraint covering the columns `[kode]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "kode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "roles_kode_key" ON "roles"("kode");
