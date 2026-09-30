/*
  Warnings:

  - You are about to drop the column `Owner_id` on the `events` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_Owner_id_fkey";

-- DropIndex
DROP INDEX "events_Owner_id_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "Owner_id",
ADD COLUMN     "owner_id" UUID NOT NULL,
ALTER COLUMN "status_verifikasi" SET DEFAULT 'PENDING',
ALTER COLUMN "status_verifikasi" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "events_owner_id_idx" ON "events"("owner_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
