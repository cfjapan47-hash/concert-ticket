-- CreateTable
CREATE TABLE "EventManager" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventManager_email_idx" ON "EventManager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventManager_eventId_email_key" ON "EventManager"("eventId", "email");

-- AddForeignKey
ALTER TABLE "EventManager" ADD CONSTRAINT "EventManager_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
