-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "motorcycle" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "billingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "motorcycle" ADD CONSTRAINT "motorcycle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
