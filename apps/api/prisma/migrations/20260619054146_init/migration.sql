-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "toolUsed" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_studentId_idx" ON "audit_logs"("studentId");

-- CreateIndex
CREATE INDEX "audit_logs_isFlagged_idx" ON "audit_logs"("isFlagged");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_studentId_timestamp_idx" ON "audit_logs"("studentId", "timestamp");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
