/*
  Warnings:

  - You are about to drop the column `alasan_penolakan` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_category_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `ticket_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "committees" DROP CONSTRAINT "committees_event_id_fkey";

-- DropForeignKey
ALTER TABLE "rab_details" DROP CONSTRAINT "rab_details_event_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_categories" DROP CONSTRAINT "ticket_categories_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_ticket_category_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_user_id_fkey";

-- DropIndex
DROP INDEX "tickets_ticket_category_id_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "alasan_penolakan",
DROP COLUMN "updated_at",
ADD COLUMN     "kategori" TEXT NOT NULL DEFAULT 'Seminar',
ADD COLUMN     "kuota" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "status_verifikasi" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rab_details" ALTER COLUMN "estimasi_biaya" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "status",
DROP COLUMN "ticket_category_id",
ADD COLUMN     "jenis_tiket" TEXT NOT NULL DEFAULT 'Umum',
ADD COLUMN     "status_tiket" TEXT NOT NULL DEFAULT 'AKTIF';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "institusi" TEXT,
ADD COLUMN     "no_whatsapp" TEXT;

-- DropTable
DROP TABLE "ticket_categories";

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_details" ADD CONSTRAINT "rab_details_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
