-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "allergies" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "disabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "Concern" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Concern_childId_idx" ON "Concern"("childId");

-- AddForeignKey
ALTER TABLE "Concern" ADD CONSTRAINT "Concern_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
