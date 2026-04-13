-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "creatorEmail" TEXT;
