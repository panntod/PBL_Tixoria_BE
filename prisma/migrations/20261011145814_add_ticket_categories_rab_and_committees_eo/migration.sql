/*
  Warnings:

  - You are about to drop the column `lokasi` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `estimasi_biaya` on the `rab_details` table. All the data in the column will be lost.
  - You are about to drop the column `jumlah_unit` on the `rab_details` table. All the data in the column will be lost.
  - You are about to drop the column `nama_item` on the `rab_details` table. All the data in the column will be lost.
  - Added the required column `divisi` to the `committees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surel` to the `committees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `committees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kota` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_tempat` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rab_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rundowns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "committees" DROP CONSTRAINT "committees_event_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "rab_details" DROP CONSTRAINT "rab_details_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_user_id_fkey";

-- AlterTable
ALTER TABLE "committees" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "divisi" TEXT NOT NULL,
ADD COLUMN     "surel" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "lokasi",
ADD COLUMN     "alasan_pembatalan" TEXT,
ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "kota" TEXT NOT NULL,
ADD COLUMN     "nama_tempat" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "banner_url" DROP NOT NULL,
ALTER COLUMN "status_verifikasi" SET DEFAULT 'DRAF';

-- AlterTable
ALTER TABLE "rab_details" DROP COLUMN "estimasi_biaya",
DROP COLUMN "jumlah_unit",
DROP COLUMN "nama_item",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "realisasi" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "rencana" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "rundowns" ADD COLUMN     "committee_id" UUID,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "waktu_mulai" SET DATA TYPE TEXT,
ALTER COLUMN "waktu_selesai" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ticket_category_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "harga" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "kuota" INTEGER NOT NULL DEFAULT 0,
    "mulai_jual" TIMESTAMP(3),
    "berakhir" TIMESTAMP(3),
    "wajib_ktm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_submission_logs" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_submission_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_categories_event_id_idx" ON "ticket_categories"("event_id");

-- CreateIndex
CREATE INDEX "event_submission_logs_event_id_idx" ON "event_submission_logs"("event_id");

-- CreateIndex
CREATE INDEX "committees_user_id_idx" ON "committees"("user_id");

-- CreateIndex
CREATE INDEX "rundowns_committee_id_idx" ON "rundowns"("committee_id");

-- CreateIndex
CREATE INDEX "tickets_ticket_category_id_idx" ON "tickets"("ticket_category_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_category_id_fkey" FOREIGN KEY ("ticket_category_id") REFERENCES "ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_details" ADD CONSTRAINT "rab_details_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rundowns" ADD CONSTRAINT "rundowns_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_submission_logs" ADD CONSTRAINT "event_submission_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
