/*
  Warnings:

  - You are about to drop the column `kode` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `nama_role` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nama]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode_tiket]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nama` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "roles_kode_key";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "kode",
DROP COLUMN "nama_role",
ADD COLUMN     "nama" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "rundowns" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3) NOT NULL,
    "judul_sesi" TEXT NOT NULL,
    "pembicara" TEXT,
    "keterangan" TEXT,

    CONSTRAINT "rundowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rundowns_event_id_idx" ON "rundowns"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nama_key" ON "roles"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_kode_tiket_key" ON "tickets"("kode_tiket");

-- AddForeignKey
ALTER TABLE "rundowns" ADD CONSTRAINT "rundowns_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
