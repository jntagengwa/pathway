-- CreateTable: implicit many-to-many Session <-> Group (Prisma uses A, B; Group first alphabetically, then Session)
CREATE TABLE "_GroupToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToSession_AB_unique" UNIQUE ("A", "B"),
    CONSTRAINT "_GroupToSession_pkey" PRIMARY KEY ("A", "B")
);

-- Migrate existing Session.groupId into join table (A = groupId, B = sessionId)
INSERT INTO "_GroupToSession" ("A", "B")
SELECT "groupId", "id" FROM "Session" WHERE "groupId" IS NOT NULL;

-- Drop FK and column on Session
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_groupId_fkey";
DROP INDEX IF EXISTS "Session_groupId_idx";
ALTER TABLE "Session" DROP COLUMN "groupId";

-- Add FKs for join table
CREATE INDEX "_GroupToSession_B_index" ON "_GroupToSession"("B");
ALTER TABLE "_GroupToSession" ADD CONSTRAINT "_GroupToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_GroupToSession" ADD CONSTRAINT "_GroupToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
