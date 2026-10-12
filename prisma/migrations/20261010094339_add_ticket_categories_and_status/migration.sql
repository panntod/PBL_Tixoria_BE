/*
  Warnings:

  - You are about to alter the column `estimasi_biaya` on the `rab_details` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_category_id` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "committees" DROP CONSTRAINT "committees_event_id_fkey";

-- DropForeignKey
ALTER TABLE "rab_details" DROP CONSTRAINT "rab_details_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_user_id_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status_verifikasi" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "rab_details" ALTER COLUMN "estimasi_biaya" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
ADD COLUMN     "ticket_category_id" UUID NOT NULL,
ALTER COLUMN "status_kehadiran" SET DEFAULT false,
ALTER COLUMN "waktu_daftar" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "harga" DECIMAL(10,2) NOT NULL,
    "kuota" INTEGER NOT NULL,
    "terjual" INTEGER NOT NULL DEFAULT 0,
    "periode_mulai" TIMESTAMP(3),
    "periode_selesai" TIMESTAMP(3),
    "perlu_ktm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_categories_event_id_idx" ON "ticket_categories"("event_id");

-- CreateIndex
CREATE INDEX "tickets_ticket_category_id_idx" ON "tickets"("ticket_category_id");

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_category_id_fkey" FOREIGN KEY ("ticket_category_id") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_details" ADD CONSTRAINT "rab_details_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
