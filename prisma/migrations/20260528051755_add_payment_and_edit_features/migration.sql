-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "invoiceNumber" INTEGER NOT NULL,
    "periodFrom" TEXT NOT NULL,
    "periodTo" TEXT NOT NULL,
    "letterSendDate" TEXT NOT NULL,
    "reviewDate" TEXT,
    "cumulativeSent" REAL NOT NULL,
    "cumulativeApproved" REAL NOT NULL,
    "periodPerformance" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalWithVat" REAL NOT NULL,
    "retentionDeduction" REAL NOT NULL,
    "insuranceDeduction" REAL NOT NULL,
    "totalDeductions" REAL NOT NULL,
    "netPayment" REAL NOT NULL,
    "finalPaymentWithVat" REAL NOT NULL,
    "actualPaid" REAL NOT NULL DEFAULT 0,
    "remainingDebt" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectInvoice" ("createdAt", "cumulativeApproved", "cumulativeSent", "description", "finalPaymentWithVat", "id", "insuranceDeduction", "invoiceNumber", "invoiceType", "letterSendDate", "netPayment", "periodFrom", "periodPerformance", "periodTo", "projectId", "retentionDeduction", "reviewDate", "totalDeductions", "totalWithVat", "vatAmount") SELECT "createdAt", "cumulativeApproved", "cumulativeSent", "description", "finalPaymentWithVat", "id", "insuranceDeduction", "invoiceNumber", "invoiceType", "letterSendDate", "netPayment", "periodFrom", "periodPerformance", "periodTo", "projectId", "retentionDeduction", "reviewDate", "totalDeductions", "totalWithVat", "vatAmount" FROM "ProjectInvoice";
DROP TABLE "ProjectInvoice";
ALTER TABLE "new_ProjectInvoice" RENAME TO "ProjectInvoice";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
