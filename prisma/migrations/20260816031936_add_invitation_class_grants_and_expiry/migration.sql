-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "accessExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "InvitationClassGrant" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "accessExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationClassGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvitationClassGrant_invitationId_idx" ON "InvitationClassGrant"("invitationId");

-- CreateIndex
CREATE INDEX "InvitationClassGrant_classId_idx" ON "InvitationClassGrant"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationClassGrant_invitationId_classId_key" ON "InvitationClassGrant"("invitationId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_fileKey_key" ON "Material"("fileKey");

-- AddForeignKey
ALTER TABLE "InvitationClassGrant" ADD CONSTRAINT "InvitationClassGrant_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationClassGrant" ADD CONSTRAINT "InvitationClassGrant_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

