-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_sessionId_idx" ON "attachments"("sessionId");

-- CreateIndex
CREATE INDEX "attachments_uploadedAt_idx" ON "attachments"("uploadedAt");

-- CreateIndex
CREATE INDEX "chat_sessions_deletedAt_idx" ON "chat_sessions"("deletedAt");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
