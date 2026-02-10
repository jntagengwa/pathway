-- AlterTable: allow re-display of signup URL to admin (token stored for same-URL response; never logged)
ALTER TABLE "PublicSignupLink" ADD COLUMN "tokenForDisplay" TEXT;
