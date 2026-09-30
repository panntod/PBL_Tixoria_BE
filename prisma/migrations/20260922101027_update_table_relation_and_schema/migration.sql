/*
  Warnings:

  - You are about to drop the column `nama` on the `roles` table. All the data in the column will be lost.
  - Added the required column `nama_role` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "roles" DROP COLUMN "nama",
ADD COLUMN     "nama_role" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "Owner_id" UUID NOT NULL,
    "judul_event" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT NOT NULL,
    "banner_url" TEXT NOT NULL,
    "status_verifikasi" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kode_tiket" TEXT NOT NULL,
    "status_kehadiran" BOOLEAN NOT NULL,
    "waktu_daftar" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nama_panitia" TEXT NOT NULL,
    "posisi_jabatan" TEXT NOT NULL,
    "kontak" TEXT NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rab_details" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nama_item" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "jumlah_unit" INTEGER NOT NULL,
    "estimasi_biaya" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "rab_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_Owner_id_idx" ON "events"("Owner_id");

-- CreateIndex
CREATE INDEX "tickets_event_id_idx" ON "tickets"("event_id");

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");

-- CreateIndex
CREATE INDEX "committees_event_id_idx" ON "committees"("event_id");

-- CreateIndex
CREATE INDEX "rab_details_event_id_idx" ON "rab_details"("event_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_Owner_id_fkey" FOREIGN KEY ("Owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_details" ADD CONSTRAINT "rab_details_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
