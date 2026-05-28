/*
  Warnings:

  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL DEFAULT 'نامشخص',
    "contractNumber" TEXT NOT NULL DEFAULT 'نامشخص',
    "contractDate" TEXT NOT NULL DEFAULT 'نامشخص',
    "contractAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Project" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
