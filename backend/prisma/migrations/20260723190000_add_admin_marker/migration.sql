-- CreateTable
CREATE TABLE "Admin" (
    "recruiter_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("recruiter_id")
);

-- AddForeignKey
ALTER TABLE "Admin"
ADD CONSTRAINT "Admin_recruiter_id_fkey"
FOREIGN KEY ("recruiter_id") REFERENCES "Recruiter"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
