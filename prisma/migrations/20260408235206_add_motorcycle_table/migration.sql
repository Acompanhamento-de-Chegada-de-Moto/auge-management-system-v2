-- CreateTable
CREATE TABLE "motorcycle" (
    "id" TEXT NOT NULL,
    "chassis" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motorcycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motorcycle_chassis_key" ON "motorcycle"("chassis");
