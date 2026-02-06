-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "Lesson_sessionId_idx" ON "Lesson"("sessionId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
