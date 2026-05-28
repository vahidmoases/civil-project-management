-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Site_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
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
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "phone" TEXT,
    "contractValue" REAL NOT NULL,
    "guaranteeType" TEXT NOT NULL,
    "guaranteeCheckNo" TEXT,
    "guaranteeCheckAmount" REAL,
    "isGuaranteeReturned" BOOLEAN NOT NULL DEFAULT false,
    "isRetentionReturned" BOOLEAN NOT NULL DEFAULT false,
    "landHandover" TEXT,
    "tempHandover" TEXT,
    "finalHandover" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subcontractor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractorInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subcontractorId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "grossAmount" REAL NOT NULL,
    "retentionDeduction" REAL NOT NULL,
    "guaranteeDeduction" REAL NOT NULL,
    "netAmount" REAL NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "SubcontractorInvoice_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractorPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subcontractorId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "referenceNumber" TEXT,
    CONSTRAINT "SubcontractorPayment_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "archivePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Letter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "reportDate" TEXT NOT NULL,
    "weather" TEXT,
    "physicalProgress" REAL NOT NULL,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyReportId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantityImported" REAL NOT NULL,
    "quantityUsed" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "ReportMaterial_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "siteName" TEXT,
    "joinDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Letter_letterNumber_key" ON "Letter"("letterNumber");
