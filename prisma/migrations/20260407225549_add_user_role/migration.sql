-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BDC', 'LOGISTICS');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole";
