/*
  Warnings:

  - The primary key for the `_GroupToSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_GroupToSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_GroupToSession" DROP CONSTRAINT "_GroupToSession_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_GroupToSession_AB_unique" ON "_GroupToSession"("A", "B");
